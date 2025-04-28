import {HttpClient, HttpHeaders} from '@angular/common/http';
import {computed, inject, Injectable} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';

import {
  Observable,
  Subject,
  catchError,
  distinctUntilChanged,
  lastValueFrom,
  map,
  merge,
  of,
  retry,
  shareReplay,
  startWith,
  switchMap,
  tap,
  timer,
} from 'rxjs';

import {CurrentUserResponse} from './types/current-user-response.type';
import {AboutLayman, HsEndpoint, HsAuthState} from 'hslayers-ng/types';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsProxyService} from 'hslayers-ng/services/utils';
import {parseBase64Style} from './parse-base64-style';

@Injectable({
  providedIn: 'root',
})
export class HsCommonLaymanService {
  endpointService = inject(HsCommonEndpointsService);
  http = inject(HttpClient);
  proxyService = inject(HsProxyService);
  hsToastService = inject(HsToastService);
  hsLanguageService = inject(HsLanguageService);
  hsLog = inject(HsLogService);

  private readonly MAX_USER_POLL_ATTEMPTS = 7;
  private readonly USER_POLL_DELAY = 2500;

  readonly layman$: Observable<HsEndpoint> = toObservable(
    this.endpointService.endpoints,
  ).pipe(
    map((endpoints) => endpoints.find((ep) => ep.type.includes('layman'))),
    switchMap((endpoint) => {
      if (!endpoint) {
        return of(undefined);
      }
      // Query version information when endpoint is available
      return this.http
        .get<AboutLayman>(endpoint.url + '/rest/about/version')
        .pipe(
          map((version) => {
            if (version) {
              return {
                ...endpoint,
                version: version.about.applications.layman.version,
              };
            }
            return endpoint;
          }),
          catchError((error) => {
            console.warn('There was an error trying to get layman version');
            return of(endpoint);
          }),
        );
    }),
    // Register the endpoint with HsUtilsService to avoid circular dependency
    tap((endpoint) => {
      if (endpoint) {
        this.proxyService.registerLaymanEndpoints(endpoint.url);
      }
    }),
    shareReplay(1),
  );

  readonly layman = toSignal(this.layman$);

  // Action streams
  login$ = new Subject<void>();
  logout$ = new Subject<void>();

  // Combined auth actions
  authActions$ = merge(
    this.login$.pipe(map(() => ({type: 'login'}))),
    this.logout$.pipe(map(() => ({type: 'logout'}))),
  );

  authState$: Observable<HsAuthState> = this.layman$.pipe(
    // Initial check for current user when endpoint is available
    switchMap((endpoint) => {
      if (!endpoint) {
        return of(undefined);
      }
      /**
       * Check for current user. In Wagtail we might receive authentication right of the bat.
       * The rest is controlled via login and logout triggers.
       */
      return this.getCurrentUser(endpoint.url).pipe(
        // Listen for auth actions after initial check
        switchMap((currentUser) => {
          return this.authActions$.pipe(
            // Start with the initial state
            startWith(null),
            // For each auth action, update the state
            switchMap((action) => {
              if (!action) {
                return of({
                  user: currentUser.username,
                  authenticated: currentUser.authenticated,
                }); // Initial state
              }

              if (action.type === 'login') {
                // On login poll for user
                return this.pollForUser().pipe(
                  map((cu) => {
                    const authenticated = !!cu?.authenticated;
                    const username = cu?.username;

                    // Show success toast if authentication was successful
                    if (authenticated && username) {
                      this.hsToastService.createToastPopupMessage(
                        'COMMON.success',
                        'AUTH.loginSuccessful',
                        {
                          type: 'success',
                          serviceCalledFrom: 'HsCommonLaymanService',
                        },
                      );
                    }

                    return {
                      user: username,
                      authenticated,
                    };
                  }),
                  catchError((error) => {
                    // Handle authentication errors
                    this.hsToastService.createToastPopupMessage(
                      'COMMON.error',
                      'AUTH.loginFailed',
                      {
                        type: 'danger',
                        serviceCalledFrom: 'HsCommonLaymanService',
                        details: [error.message || 'AUTH.loginFailed'],
                      },
                    );

                    // Return endpoint with authentication failed
                    return of({
                      user: undefined,
                      authenticated: false,
                    });
                  }),
                );
              }
              if (action.type === 'logout') {
                if (this.isAuthenticated()) {
                  this.hsToastService.createToastPopupMessage(
                    'AUTH.Logout',
                    'AUTH.logoutSuccessful',
                    {
                      type: 'success',
                    },
                  );
                }
                // On logout action, clear user data
                return of({
                  ...endpoint,
                  user: undefined,
                  authenticated: false,
                });
              }
            }),
          );
        }),
      );
    }),
    shareReplay(1),
  );

  authState = toSignal(this.authState$);

  // Always return a boolean value, defaulting to false when layman is undefined
  isAuthenticated = computed(() => !!this.authState()?.authenticated);
  user = computed(() => this.authState()?.user);

  // Create an observable for the authenticating state
  isAuthenticating = toSignal(
    merge(
      // Set to true when login action is triggered
      this.login$.pipe(map(() => true)),

      // Set to false when layman$ emits a new value (authentication completed)
      this.authState$.pipe(map(() => false)),
    ).pipe(startWith(false), distinctUntilChanged(), shareReplay(1)),
  );

  /**
   * Get current user from layman endpoint
   * @param endpoint - Layman endpoint
   */
  getCurrentUser(endpoint_url: HsEndpoint['url']) {
    if (!endpoint_url) {
      return of(undefined);
    }
    const url = `${endpoint_url}/rest/current-user`;
    return this.http
      .get<CurrentUserResponse>(url, {withCredentials: true})
      .pipe(
        catchError((error) => {
          // Handle errors from getCurrentUser
          this.hsToastService.createToastPopupMessage(
            'COMMON.error',
            'AUTH.userInfoFailed',
            {
              type: 'danger',
              serviceCalledFrom: 'HsCommonLaymanService',
              details: [error.message || 'AUTH.userInfoFailed'],
            },
          );
          return of({
            authenticated: false,
            username: undefined,
          });
        }),
      );
  }

  /**
   * Log into existing account by opening a login endpoint in new window
   * and polling for the results
   */
  pollForUser(): Observable<CurrentUserResponse | undefined> {
    const laymanEndpoint = this.layman();
    if (!laymanEndpoint) {
      return of(undefined);
    }

    return timer(1000).pipe(
      switchMap(() =>
        this.getCurrentUser(laymanEndpoint.url).pipe(
          switchMap((response) => {
            if (!response || !response.authenticated) {
              // Handle case where authenticated is false
              throw new Error('AUTH.notAuthenticated');
            }
            return of(response);
          }),
        ),
      ),
      retry({
        count: this.MAX_USER_POLL_ATTEMPTS,
        delay: this.USER_POLL_DELAY,
      }),
      catchError((error) => {
        // Handle error after all retries are exhausted
        console.error('Error retrieving profile:', error);

        // Show error toast after retries are exhausted
        this.hsToastService.createToastPopupMessage(
          'COMMON.error',
          'AUTH.authenticationFailed',
          {
            type: 'danger',
            serviceCalledFrom: 'HsCommonLaymanService',
            details: [
              'AUTH.authenticationFailed',
              error.message || 'Unknown error occurred',
            ],
          },
        );

        return of(null);
      }),
    );
  }

  async logout(): Promise<void> {
    const laymanEndpoint = this.layman();
    if (!laymanEndpoint) {
      return;
    }

    const url = `${laymanEndpoint.url}/logout`;
    try {
      await lastValueFrom(this.http.get(url, {withCredentials: true}));
    } catch (ex) {
      this.hsLog.warn(ex);
    } finally {
      /***
       * TODO: this might go first
       */
      this.logout$.next();
    }
  }

  displayLaymanError(
    endpoint: HsEndpoint,
    errorMsg: string,
    responseBody: {code?: number; message?: string; detail?: string},
  ): void {
    let simplifiedResponse = '';
    if (responseBody.code === undefined) {
      simplifiedResponse = 'COMMON.unknownError';
    }
    switch (responseBody.code) {
      case 48:
        simplifiedResponse = 'mapExtentFilterMissing';
        break;
      case 32:
        simplifiedResponse = 'Authentication failed. Login to the catalogue.';
        //this.detectAuthChange(endpoint);
        break;
      default:
        simplifiedResponse = responseBody.message;
        if (responseBody.detail) {
          simplifiedResponse = simplifiedResponse + ' ' + responseBody.detail;
        }
    }
    //If response is object, it is an error response
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation(errorMsg, undefined),
      endpoint.title +
        ': ' +
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          simplifiedResponse,
          undefined,
        ),
      {
        disableLocalization: true,
        serviceCalledFrom: 'HsCommonLaymanService',
        type: 'danger',
      },
    );
  }

  async getStyleFromUrl(styleUrl: string): Promise<string> {
    try {
      return await lastValueFrom(
        this.http
          .get(styleUrl, {
            headers: new HttpHeaders().set('Content-Type', 'text'),
            responseType: 'text',
            withCredentials: true,
          })
          .pipe(map((response) => parseBase64Style(response))),
      );
    } catch (ex) {
      this.hsLog.error(ex);
    }
  }
}
