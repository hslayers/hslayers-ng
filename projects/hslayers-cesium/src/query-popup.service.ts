import {Injectable, NgZone} from '@angular/core';

import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {
  HsConfig,
  HsMapService,
  HsQueryBaseService,
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
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse = [];
  hoverPopup: any;

  constructor(
    HsMapService: HsMapService,
    private HsConfig: HsConfig,
    HsUtilsService: HsUtilsService,
    zone: NgZone,
    private HsQueryBaseService: HsQueryBaseService,
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

  registerPopup(nativeElement: any) {
    nativeElement.style.position = 'absolute';
    this.hoverPopup = nativeElement;
  }

  showPopup(e: any): void {
    this.hoverPopup.style.left = e.pixel.x + 4 + 'px';
    this.hoverPopup.style.top = e.pixel.y + 4 + 'px';
  }
}
