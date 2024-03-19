import {Component, OnInit} from '@angular/core';

import {HsGeolocationService} from './geolocation.service';
import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
@Component({
  selector: 'hs-geolocation',
  templateUrl: './geolocation.component.html',
})
export class HsGeolocationComponent
  extends HsGuiOverlayBaseComponent
  implements OnInit
{
  collapsed: boolean;

  name = 'geolocationButton';

  constructor(private hsGeolocationService: HsGeolocationService) {
    super();
  }
  ngOnInit(): void {
    this.collapsed = true;
    super.ngOnInit();
  }
  isVisible(): boolean {
    return (
      this.hsLayoutService.componentEnabled('geolocationButton') &&
      this.hsLayoutService.componentEnabled('guiOverlay')
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
