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
  implements OnInit
{
  collapsed: boolean;
  constructor(
    private hsGeolocationService: HsGeolocationService,
    public HsLayoutService: HsLayoutService
  ) {
    super(HsLayoutService);
  }
  ngOnInit(): void {
    this.collapsed = true;
  }
  isVisible(): boolean {
    return (
      this.HsLayoutService.componentEnabled('geolocationButton') &&
      this.HsLayoutService.componentEnabled('guiOverlay')
    );
  }

  /**
   * Start localization
   */
  startLocalization(): void {
    this.hsGeolocationService.startLocalization();
  }

  /**
   * Stop localization
   */
  stopLocalization(): void {
    this.hsGeolocationService.stopLocalization();
  }

  /**
   * Get localization
   */
  getLocalization(): boolean {
    return this.hsGeolocationService.localization;
  }

  /**
   * Toggle tracking
   */
  toggleTracking(): void {
    this.hsGeolocationService.toggleTracking();
  }

  /**
   * Determine state of tracking
   */
  isFollowing(): boolean {
    return this.hsGeolocationService.following;
  }
}
