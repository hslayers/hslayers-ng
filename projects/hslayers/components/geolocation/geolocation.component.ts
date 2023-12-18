import {Component, OnInit} from '@angular/core';

import {HsGuiOverlayBaseComponent} from '../layout/panels/gui-overlay-base.component';
import {HsGeolocationService} from './geolocation.service';
import {HsLayoutService} from '../layout/layout.service';
@Component({
  selector: 'hs-geolocation',
  templateUrl: './geolocation.component.html',
})
export class HsGeolocationComponent
  extends HsGuiOverlayBaseComponent
  implements OnInit {
  collapsed: boolean;

  name = 'geolocationButton';

  constructor(
    private hsGeolocationService: HsGeolocationService,
    public HsLayoutService: HsLayoutService,
  ) {
    super(HsLayoutService);
  }
  ngOnInit(): void {
    this.collapsed = true;
    super.ngOnInit();
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
