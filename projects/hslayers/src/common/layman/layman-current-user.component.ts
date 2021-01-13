import {Component} from '@angular/core';
import {HsCommonLaymanService} from './layman.service';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {HsLaymanLoginComponent} from './layman-login.component';
import {HttpClient} from '@angular/common/http';
import {Input} from '@angular/core';

@Component({
  selector: 'hs-layman-current-user',
  templateUrl: './layman-current-user.html',
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
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsDialogContainerService: HsDialogContainerService
  ) {}

  isAuthorized() {
    return this.endpoint.user == 'anonymous' || this.endpoint.user == 'browser';
  }

  logout(): void {
    this.monitorUser();
    this.HsCommonLaymanService.logout(this.endpoint);
  }

  protocolsMatch() {
    return location.protocol.slice(0, -1) == this.endpoint.liferayProtocol;
  }

  authUrl() {
    return this.endpoint.url + '/authn/oauth2-liferay/login';
  }

  /**
   * Periodically poll layman client endpoint for auth change.
   * This is used for hiding login iframe and toggling state for login buttons,
   * which is done in separate modules by subscribing to HsCommonLaymanService.authChange
   */
  monitorUser(): void {
    if (this.getCurrentUserTimer) {
      clearTimeout(this.getCurrentUserTimer);
    }
    this.monitorTries = 0;
    this.timerInterval = this.DEFAULT_TIMER_INTERVAL;
    const poll = () => {
      this.HsCommonLaymanService.detectAuthChange(this.endpoint).then(
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

  login(): void {
    this.monitorUser();
    if (!this.protocolsMatch()) {
      return;
    }
    this.HsDialogContainerService.create(
      HsLaymanLoginComponent,
      this.authUrl()
    );
  }
}
