import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsCommonLaymanService {
  authChange = new Subject();
  constructor(private $http: HttpClient) {}

  async getCurrentUser(endpoint) {
    const url = `${endpoint.url}/rest/current-user`;
    return this.$http.get(url).subscribe(
      (res: any) => {
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
      },
      (e) => {
        console.warn(e);
        return e;
      }
    );
  }

  async getCurrentUserIfNeeded(endpoint) {
    if (
      endpoint.user === undefined ||
      ['anonymous', 'browser'].includes(endpoint.user)
    ) {
      await this.getCurrentUser(endpoint);
    }
  }

  async logout(endpoint) {
    const url = `${endpoint.url}/authn/logout`;
    try {
      const response = await this.$http.get(url).toPromise();
    } catch (ex) {
      console.warn(ex);
    } finally {
      endpoint.user = 'anonymous';
      this.authChange.next(endpoint);
    }
  }
}
