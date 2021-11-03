import {Injectable, NgZone} from '@angular/core';

import {Feature, Map} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfig} from '../../config.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryPopupBaseService} from './query-popup-base.service';
import {HsQueryPopupServiceModel} from './query-popup.service.model';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupService
  extends HsQueryPopupBaseService
  implements HsQueryPopupServiceModel {
  map: Map;
  featuresUnderMouse: Feature<Geometry>[] = [];
  featureLayersUnderMouse = [];
  hoverPopup: any;

  constructor(
    HsMapService: HsMapService,
    private HsConfig: HsConfig,
    HsUtilsService: HsUtilsService,
    zone: NgZone,
    private HsQueryBaseService: HsQueryBaseService
  ) {
    super(HsMapService, HsUtilsService, zone);
    this.HsMapService.loaded().then(() => this.init());
  }

  init() {
    this.map = this.HsMapService.map;
    if (this.HsConfig.popUpDisplay && this.HsConfig.popUpDisplay === 'hover') {
      this.map.on(
        'pointermove',
        this.HsUtilsService.debounce(this.preparePopup, 200, false, this)
      );
    } else if (
      this.HsConfig.popUpDisplay &&
      this.HsConfig.popUpDisplay === 'click'
    ) {
      this.map.on(
        'singleclick',
        this.HsUtilsService.debounce(this.preparePopup, 200, false, this)
      );
    } /* else none */
  }

  /**
   * Get features dependent on mouse position.
   * For cesium the features will be filled differently.
   * @param e 
   * @returns 
   */
  preparePopup(e: {
    map: Map;
    pixel: number[];
    dragging?: any;
    originalEvent?: any;
  }) {
    // The latter case happens when hovering over the pop-up itself
    if (e.dragging || e.originalEvent?.target?.tagName != 'CANVAS') {
      return;
    }
    if (!this.HsQueryBaseService.queryActive) {
      return;
    }
    const tmpFeatures = this.HsQueryBaseService.getFeaturesUnderMouse(
      e.map,
      e.pixel
    );
    if (
      tmpFeatures.some(
        (f) => !this.featuresUnderMouse.includes(f as Feature<Geometry>)
      ) ||
      this.featuresUnderMouse.some((f) => !tmpFeatures.includes(f))
    ) {
      this.fillFeatures(tmpFeatures as Feature<Geometry>[]);
    }
    this.showPopup(e);
  }

  /**
   * Set popups position according to pixel where mouse is
   * @param e Event, which triggered this function
   */
  showPopup(e: any): void {
    const map = e.map;

    const pixel = e.pixel;
    pixel[0] += 2;
    pixel[1] += 4;
    if (this.hoverPopup) {
      this.hoverPopup.setPosition(map.getCoordinateFromPixel(e.pixel));
    }
  }
}
