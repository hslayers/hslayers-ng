import {Injectable, NgZone} from '@angular/core';

import {HsMapService} from 'hslayers-ng/services/map';
import {
  HsQueryPopupBaseService,
  HsQueryPopupServiceModel,
  HsQueryPopupWidgetContainerService,
} from 'hslayers-ng/common/query-popup';
import {HsUtilsService} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumQueryPopupService
  extends HsQueryPopupBaseService
  implements HsQueryPopupServiceModel {
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
