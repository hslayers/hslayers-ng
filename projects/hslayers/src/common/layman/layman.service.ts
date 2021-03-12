import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsCommonLaymanService {
  authChange = new Subject();
  constructor(private $http: HttpClient) {}

  /**
   *  Monitor if authorization state has changed and
   * return true and broadcast authChange event if so .
   * @param endpoint Endpoint definition - usually Layman
   * @return Promise<boolean> true if authorization state changed (user logged in or out)
   */
  async detectAuthChange(endpoint): Promise<boolean> {
    const url = `${endpoint.url}/rest/current-user`;
    try {
      const res: any = await this.$http
        .get(url, {withCredentials: true})
        .toPromise();

      let somethingChanged = false;
      if (res.username) {
        if (endpoint.user != res.username) {
          endpoint.user = res.username;
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
      this.authChange.next(endpoint);
    }
  }
}
