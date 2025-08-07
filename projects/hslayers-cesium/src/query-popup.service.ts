import {Injectable} from '@angular/core';

import {
  HsQueryPopupBaseService,
  HsQueryPopupServiceModel,
} from 'hslayers-ng/common/query-popup';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumQueryPopupService
  extends HsQueryPopupBaseService
  implements HsQueryPopupServiceModel
{
  registerPopup(nativeElement) {
    nativeElement.style.position = 'absolute';
    this.hoverPopup = nativeElement;
  }

  showPopup(e): void {
    this.hoverPopup.style.left = e.pixel.x + 4 + 'px';
    this.hoverPopup.style.top = e.pixel.y + 4 + 'px';
  }
}
