import {Injectable, NgZone} from '@angular/core';

import {Feature, Map, Overlay} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfig} from '../../config.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryPopupBaseService} from './query-popup-base.service';
import {HsQueryPopupServiceModel} from './query-popup.service.model';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupService
  extends HsQueryPopupBaseService
  implements HsQueryPopupServiceModel
{
  constructor(
    hsMapService: HsMapService,
    public hsConfig: HsConfig,
    hsUtilsService: HsUtilsService,
    zone: NgZone,
    private HsQueryBaseService: HsQueryBaseService,
    hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService
  ) {
    super(
      hsMapService,
      hsUtilsService,
      zone,
      hsConfig,
      hsQueryPopupWidgetContainerService
    );
  }

  registerPopup(nativeElement: any, app: string) {
    this.setAppIfNeeded(app);
    this.apps[app].hoverPopup = new Overlay({
      element: nativeElement,
    });
  }

  async init(app: string) {
    this.setAppIfNeeded(app);
    await this.hsMapService.loaded(app);
    this.apps[app].map = this.hsMapService.getMap(app);
    if (
      this.hsConfig.get(app).popUpDisplay &&
      this.hsConfig.get(app).popUpDisplay === 'hover'
    ) {
      this.apps[app].map.on(
        'pointermove',
        this.hsUtilsService.debounce(
          (e) => this.preparePopup(e, app),
          200,
          false,
          this
        )
      );
    } else if (
      this.hsConfig.get(app).popUpDisplay &&
      this.hsConfig.get(app).popUpDisplay === 'click'
    ) {
      this.apps[app].map.on(
        'singleclick',
        this.hsUtilsService.debounce(
          (e) => this.preparePopup(e, app),
          200,
          false,
          this
        )
      );
    } /* else none */
  }

  /**
   * Get features dependent on mouse position.
   * For cesium the features will be filled differently.
   * @param e -
   * @returns
   */
  preparePopup(
    e: {
      map: Map;
      pixel: number[];
      dragging?: any;
      originalEvent?: any;
    },
    app: string
  ) {
    // The latter case happens when hovering over the pop-up itself
    if (e.dragging || e.originalEvent?.target?.tagName != 'CANVAS') {
      return;
    }
    if (!this.HsQueryBaseService.get(app).queryActive) {
      return;
    }
    const tmpFeatures = this.HsQueryBaseService.getFeaturesUnderMouse(
      e.map,
      e.pixel,
      app
    );
    if (
      tmpFeatures.some(
        (f) =>
          !this.apps[app].featuresUnderMouse.includes(f as Feature<Geometry>)
      ) ||
      this.apps[app].featuresUnderMouse.some((f) => !tmpFeatures.includes(f))
    ) {
      this.fillFeatures(tmpFeatures as Feature<Geometry>[], app);
    }
    this.showPopup(e, app);
  }

  /**
   * Set popups position according to pixel where mouse is
   * @param e - Event, which triggered this function
   */
  showPopup(e: any, app: string): void {
    const map = e.map;

    const pixel = e.pixel;
    pixel[0] += 2;
    pixel[1] += 4;
    if (this.apps[app].hoverPopup) {
      this.apps[app].hoverPopup.setPosition(
        map.getCoordinateFromPixel(e.pixel)
      );
    }
  }
}
