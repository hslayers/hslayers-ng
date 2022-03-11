import {Injectable, NgZone} from '@angular/core';

import {
  HsConfig,
  HsMapService,
  HsQueryPopupBaseService,
  HsQueryPopupData,
  HsQueryPopupServiceModel,
  HsQueryPopupWidgetContainerService,
  HsUtilsService,
} from 'hslayers-ng';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumQueryPopupService
  extends HsQueryPopupBaseService
  implements HsQueryPopupServiceModel {
  constructor(
    HsMapService: HsMapService,
    private HsConfig: HsConfig,
    HsUtilsService: HsUtilsService,
    zone: NgZone,
    hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService
  ) {
    super(
      HsMapService,
      HsUtilsService,
      zone,
      HsConfig,
      hsQueryPopupWidgetContainerService
    );
  }

  async init(app: string) {
    this.setAppIfNeeded(app);
  }

  /**
   * Get the params saved by the cesium query popup service for the current app
   * @param app - App identifier
   */
  get(app: string): HsQueryPopupData {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsQueryPopupData();
    }
    return this.apps[app ?? 'default'];
  }
  registerPopup(nativeElement: any, app: string) {
    nativeElement.style.position = 'absolute';
    this.get(app).hoverPopup = nativeElement;
  }

  showPopup(e: any, app: string): void {
    this.get(app).hoverPopup.style.left = e.pixel.x + 4 + 'px';
    this.get(app).hoverPopup.style.top = e.pixel.y + 4 + 'px';
  }
}
