import {Component, OnInit} from '@angular/core';
import {Input} from '@angular/core';

import {HsCommonLaymanService} from './layman.service';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {HsLaymanLoginComponent} from './layman-login.component';
import {HsLaymanService} from '../../components/save-map/layman.service';

@Component({
  selector: 'hs-layman-current-user',
  templateUrl: './layman-current-user.html',
})
export class HsLaymanCurrentUserComponent implements OnInit {
  @Input() app = 'default';
  @Input() endpoint?;
  monitorTries = 0;
  DEFAULT_TIMER_INTERVAL = 2000;
  MAX_MONITOR_TRIES = 100;
  timerInterval = this.DEFAULT_TIMER_INTERVAL;
  getCurrentUserTimer;

  constructor(
    private hsLaymanService: HsLaymanService,
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsDialogContainerService: HsDialogContainerService
  ) {}
  ngOnInit(): void {
    if (!this.endpoint) {
      this.endpoint = this.hsLaymanService.getLaymanEndpoint();
    }
  }

  isGuest() {
    return this.endpoint.user == 'anonymous';
  }

  logout(): void {
    this.monitorUser();
    this.HsCommonLaymanService.logout(this.endpoint, this.app);
  }

  sameDomain() {
    const endpointUrl = new URL(this.endpoint.url);
    return (
      location.protocol == endpointUrl.protocol &&
      location.host == endpointUrl.host
    );
  }

  authUrl() {
    return this.endpoint.url + '/login';
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
      this.HsCommonLaymanService.detectAuthChange(this.endpoint, this.app).then(
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
    if (!this.sameDomain()) {
      return;
    }
    this.HsDialogContainerService.create(
      HsLaymanLoginComponent,
      {url: this.authUrl()},
      this.app
    );
  }
}
