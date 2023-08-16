import {Injectable, NgZone} from '@angular/core';

import {
  HsMapService,
  HsQueryPopupBaseService,
  HsQueryPopupServiceModel,
  HsQueryPopupWidgetContainerService,
  HsUtilsService,
} from 'hslayers-ng';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumQueryPopupService
  extends HsQueryPopupBaseService
  implements HsQueryPopupServiceModel
{
  constructor(
    HsMapService: HsMapService,
    HsUtilsService: HsUtilsService,
    zone: NgZone,
    hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
  ) {
    super(
      HsMapService,
      HsUtilsService,
      zone,
      hsQueryPopupWidgetContainerService,
    );
  }

  registerPopup(nativeElement: any) {
    nativeElement.style.position = 'absolute';
    this.hoverPopup = nativeElement;
  }

  showPopup(e: any): void {
    this.hoverPopup.style.left = e.pixel.x + 4 + 'px';
    this.hoverPopup.style.top = e.pixel.y + 4 + 'px';
  }
}
