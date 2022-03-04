import {Component, OnInit} from '@angular/core';

import {HsGeolocationService} from './geolocation.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
@Component({
  selector: 'hs-geolocation',
  templateUrl: './partials/geolocation.component.html',
})
export class HsGeolocationComponent
  extends HsPanelBaseComponent
  implements OnInit {
  collapsed: boolean;
  constructor(
    private hsGeolocationService: HsGeolocationService,
    public HsLayoutService: HsLayoutService
  ) {
    super(HsLayoutService);
  }
  ngOnInit(): void {
    this.collapsed = true;
    this.hsGeolocationService.init(this.data.app);
  }
  isVisible(): boolean {
    return (
      this.HsLayoutService.componentEnabled(
        'geolocationButton',
        this.data.app
      ) && this.HsLayoutService.componentEnabled('guiOverlay', this.data.app)
    );
  }

  /**
   * Start localization
   */
  startLocalization(): void {
    this.hsGeolocationService.startLocalization(this.data.app);
  }

  /**
   * Stop localization
   */
  stopLocalization(): void {
    this.hsGeolocationService.stopLocalization(this.data.app);
  }

  /**
   * Get localization
   */
  getLocalization(): boolean {
    return this.hsGeolocationService.apps[this.data.app].localization;
  }

  /**
   * Toggle tracking
   */
  toggleTracking(): void {
    this.hsGeolocationService.toggleTracking(this.data.app);
  }

  /**
   * Determine state of tracking
   */
  isFollowing(): boolean {
    return this.hsGeolocationService.apps[this.data.app].following;
  }
}
