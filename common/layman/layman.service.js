import {Subject} from 'rxjs';

export class HsCommonLaymanService {
  constructor($http, $rootScope) {
    'ngInject';
    Object.assign(this, {
      $http,
      $rootScope,
      authChange: new Subject(),
    });
  }

  async getCurrentUser(endpoint) {
    const url = `${endpoint.url}/rest/current-user`;
    return this.$http.get(url).then(
      (res) => {
        let somethingChanged = false;
        if (res.data.username) {
          if (endpoint.user != res.data.username) {
            endpoint.user = res.data.username;
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
      const response = await this.$http.get(url);
    } catch (ex) {
      console.warn(ex);
    } finally {
      endpoint.user = 'anonymous';
      this.authChange.next(endpoint);
    }
  }
}
