import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {BehaviorSubject, Subject, lastValueFrom} from 'rxjs';

import {CurrentUserResponse} from './types/current-user-response.type';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsToastService} from 'hslayers-ng/common/toast';

@Injectable({
  providedIn: 'root',
})
export class HsCommonLaymanService {
  authChange: Subject<HsEndpoint> = new Subject();

  layman$: BehaviorSubject<HsEndpoint | undefined> = new BehaviorSubject(
    undefined,
  );

  public get layman(): HsEndpoint {
    return this.layman$.getValue();
  }

  constructor(
    private $http: HttpClient,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService,
    private hsLog: HsLogService,
  ) {}

  isAuthenticated() {
    return this.layman?.authenticated;
  }

  /**
   *  Monitor if authorization state has changed and
   * return true and broadcast authChange event if so .
   * @param endpoint - Endpoint definition - usually Layman
   * @returns Promise<boolean> true if authorization state changed (user logged in or out)
   */
  async detectAuthChange(endpoint: HsEndpoint): Promise<boolean> {
    const url = `${endpoint.url}/rest/current-user`;
    try {
      const res: CurrentUserResponse = await lastValueFrom(
        this.$http.get(url, {withCredentials: true}),
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
          this.authChange.next(endpoint);
        }
      } else {
        if (endpoint.user != undefined) {
          somethingChanged = true;
        }
        endpoint.user = undefined;
      }
      return somethingChanged;
    } catch (e) {
      this.hsLog.warn(e);
      return e;
    }
  }

  async getCurrentUserIfNeeded(endpoint: HsEndpoint): Promise<void> {
    if (endpoint.type.includes('layman') && endpoint.user === undefined) {
      await this.detectAuthChange(endpoint);
    }
  }

  async logout(endpoint): Promise<void> {
    const url = `${endpoint.url}/logout`;
    try {
      await lastValueFrom(this.$http.get(url, {withCredentials: true}));
    } catch (ex) {
      this.hsLog.warn(ex);
    } finally {
      endpoint.user = undefined;
      endpoint.authenticated = false;
      this.authChange.next(endpoint);
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
        this.detectAuthChange(endpoint);
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
      {disableLocalization: true, serviceCalledFrom: 'HsCommonLaymanService'},
    );
  }

  async getStyleFromUrl(styleUrl: string): Promise<string> {
    try {
      return await lastValueFrom(
        this.$http.get(styleUrl, {
          headers: new HttpHeaders().set('Content-Type', 'text'),
          responseType: 'text',
          withCredentials: true,
        }),
      );
    } catch (ex) {
      this.hsLog.error(ex);
    }
  }
}
