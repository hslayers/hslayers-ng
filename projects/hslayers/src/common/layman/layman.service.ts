import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Subject} from 'rxjs';

import {HsEndpoint} from '../endpoints/endpoint.interface';
import {HsLanguageService} from '../../components/language/language.service';
import {HsToastService} from '../../components/layout/toast/toast.service';

@Injectable({
  providedIn: 'root',
})
export class HsCommonLaymanService {
  authChange: Subject<HsEndpoint> = new Subject();
  constructor(
    private $http: HttpClient,
    public hsToastService: HsToastService,
    public hsLanguageService: HsLanguageService
  ) {}

  /**
   *  Monitor if authorization state has changed and
   * return true and broadcast authChange event if so .
   * @param endpoint - Endpoint definition - usually Layman
   * @returns Promise<boolean> true if authorization state changed (user logged in or out)
   */
  async detectAuthChange(endpoint): Promise<boolean> {
    const url = `${endpoint.url}/rest/current-user`;
    try {
      const res: any = await this.$http
        .get(url, {withCredentials: true})
        .toPromise();

      let somethingChanged = false;
      if (res.code === 32) {
        endpoint.authenticated = false;
        endpoint.user = endpoint.originalConfiguredUser;
      }
      if (res.username) {
        if (endpoint.user != res.username) {
          endpoint.user = res.username;
          endpoint.authenticated = res.authenticated;
          somethingChanged = true;
          this.authChange.next(endpoint);
        }
      } else {
        if (endpoint.user != endpoint.originalConfiguredUser) {
          somethingChanged = true;
        }
        endpoint.user = endpoint.originalConfiguredUser;
      }
      return somethingChanged;
    } catch (e) {
      console.warn(e);
      return e;
    }
  }

  async getCurrentUserIfNeeded(endpoint): Promise<void> {
    if (
      endpoint.user === undefined ||
      ['anonymous', 'browser'].includes(endpoint.user)
    ) {
      await this.detectAuthChange(endpoint);
    }
  }

  async logout(endpoint): Promise<void> {
    const url = `${endpoint.url}/logout`;
    try {
      const response = await this.$http
        .get(url, {withCredentials: true})
        .toPromise();
    } catch (ex) {
      console.warn(ex);
    } finally {
      endpoint.user = 'anonymous';
      endpoint.authenticated = false;
      this.authChange.next(endpoint);
    }
  }

  displayLaymanError(
    endpoint: HsEndpoint,
    errorMsg: string,
    responseBody: any
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
        simplifiedResponse = responseBody.message + ' ' + responseBody.detail;
    }
    //If response is object, it is an error response
    this.hsToastService.createToastPopupMessage(
      this.hsLanguageService.getTranslation(errorMsg),
      endpoint.title +
        ': ' +
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          simplifiedResponse
        ),
      {disableLocalization: true, serviceCalledFrom: 'HsCommonLaymanService'}
    );
  }
}
