import {Component} from '@angular/core';
import {HsCommonLaymanService} from './layman.service';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {HsLaymanLoginComponent} from './layman-login.component';
import {HttpClient} from '@angular/common/http';
import {Input} from '@angular/core';

@Component({
  selector: 'hs-layman-current-user',
  template: require('./layman-current-user.html'),
})
export class HsLaymanCurrentUserComponent {
  @Input() endpoint;
  monitorTries = 0;
  DEFAULT_TIMER_INTERVAL = 2000;
  MAX_MONITOR_TRIES = 100;
  timerInterval = this.DEFAULT_TIMER_INTERVAL;
  getCurrentUserTimer;

  constructor(
    private $http: HttpClient,
    private HsCommonLaymanService: HsCommonLaymanService,
    private HsDialogContainerService: HsDialogContainerService
  ) {}

  isAuthorized() {
    return this.endpoint.user == 'anonymous' || this.endpoint.user == 'browser';
  }

  logout() {
    this.monitorUser();
    this.HsCommonLaymanService.logout(this.endpoint);
  }

  protocolsMatch() {
    return location.protocol == this.endpoint.liferayProtocol;
  }

  authUrl() {
    return this.endpoint.url + '/authn/oauth2-liferay/login';
  }

  monitorUser() {
    if (this.getCurrentUserTimer) {
      clearTimeout(this.getCurrentUserTimer);
    }
    this.monitorTries = 0;
    this.timerInterval = this.DEFAULT_TIMER_INTERVAL;
    /**
     *
     */
    const poll = () => {
      this.HsCommonLaymanService.getCurrentUser(this.endpoint).then(
        (somethingChanged) => {
          if (somethingChanged && this.getCurrentUserTimer) {
            clearTimeout(this.getCurrentUserTimer);
            this.monitorTries = this.MAX_MONITOR_TRIES;
          }
        }
      );
      this.monitorTries++;
      if (this.monitorTries > this.MAX_MONITOR_TRIES) {
        clearTimeout(this.getCurrentUserTimer);
      }
      this.getCurrentUserTimer = setTimeout(poll, this.timerInterval);
    };
    this.getCurrentUserTimer = setTimeout(poll, this.timerInterval);
  }

  login() {
    this.monitorUser();
    if (!this.protocolsMatch()) {
      return;
    }
    this.HsDialogContainerService.create(HsLaymanLoginComponent, {});
  }
}
