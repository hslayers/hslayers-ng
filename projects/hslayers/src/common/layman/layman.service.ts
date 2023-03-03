import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {BehaviorSubject, Subject, lastValueFrom} from 'rxjs';

import {CurrentUserResponse} from './types/current-user-response.type';
import {HsEndpoint} from '../endpoints/endpoint.interface';
import {HsLanguageService} from '../../components/language/language.service';
import {HsToastService} from '../../components/layout/toast/toast.service';

@Injectable({
  providedIn: 'root',
})
export class HsCommonLaymanService {
  authChange: Subject<{endpoint: HsEndpoint; app: string}> = new Subject();

  layman$: BehaviorSubject<HsEndpoint | undefined> = new BehaviorSubject(
    undefined
  );

  public get layman(): HsEndpoint {
    return this.layman$.getValue();
  }

  constructor(
    private $http: HttpClient,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService
  ) {}

  isAuthenticated() {
    return this.layman.authenticated;
  }

  /**
   *  Monitor if authorization state has changed and
   * return true and broadcast authChange event if so .
   * @param endpoint - Endpoint definition - usually Layman
   * @param app - App identifier
   * @returns Promise<boolean> true if authorization state changed (user logged in or out)
   */
  async detectAuthChange(endpoint, app: string): Promise<boolean> {
    const url = `${endpoint.url}/rest/current-user`;
    try {
      const res: CurrentUserResponse = await lastValueFrom(
        this.$http.get(url, {withCredentials: true})
      );

      let somethingChanged = false;
      if (res.code === 32) {
        endpoint.authenticated = false;
        endpoint.user = undefined;
      }
      if (res.username) {
        if (endpoint.user != res.username) {
          endpoint.user = res.username;
          endpoint.authenticated = res.authenticated;
          somethingChanged = true;
          this.authChange.next({endpoint, app});
        }
      } else {
        if (endpoint.user != undefined) {
          somethingChanged = true;
        }
        endpoint.user = undefined;
      }
      return somethingChanged;
    } catch (e) {
      console.warn(e);
      return e;
    }
  }

  async getCurrentUserIfNeeded(endpoint, app: string): Promise<void> {
    if (endpoint.user === undefined) {
      await this.detectAuthChange(endpoint, app);
    }
  }

  async logout(endpoint, app: string): Promise<void> {
    const url = `${endpoint.url}/logout`;
    try {
      await lastValueFrom(this.$http.get(url, {withCredentials: true}));
    } catch (ex) {
      console.warn(ex);
    } finally {
      endpoint.user = undefined;
      endpoint.authenticated = false;
      this.authChange.next({endpoint, app});
    }
  }

  displayLaymanError(
    endpoint: HsEndpoint,
    errorMsg: string,
    responseBody: {code?: number; message?: string; detail?: string},
    app: string
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
        this.detectAuthChange(endpoint, app);
        break;
      default:
        simplifiedResponse = responseBody.message;
        if (responseBody.detail) {
          simplifiedResponse = simplifiedResponse + ' ' + responseBody.detail;
        }
    }
    //If response is object, it is an error response
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation(errorMsg, undefined, app),
      endpoint.title +
        ': ' +
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          simplifiedResponse,
          undefined,
          app
        ),
      {disableLocalization: true, serviceCalledFrom: 'HsCommonLaymanService'},
      app
    );
  }
}
