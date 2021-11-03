import {Injectable, NgZone} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {
  HsConfig,
  HsMapService,
  HsQueryPopupBaseService,
  HsQueryPopupServiceModel,
  HsUtilsService,
} from 'hslayers-ng';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumQueryPopupService
  extends HsQueryPopupBaseService
  implements HsQueryPopupServiceModel
{
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse = [];
  hoverPopup: any;

  constructor(
    HsMapService: HsMapService,
    private HsConfig: HsConfig,
    HsUtilsService: HsUtilsService,
    zone: NgZone
  ) {
    super(HsMapService, HsUtilsService, zone);
  }

  registerPopup(nativeElement: any) {
    this.hoverPopup = nativeElement;
  }

  showPopup(e: any): void {}
}
