import {Injectable, NgZone} from '@angular/core';

import {Feature, Map, Overlay} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfig} from 'hslayers-ng/config';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsQueryBaseService} from 'hslayers-ng/shared/query';
import {HsQueryPopupBaseService} from './query-popup-base.service';
import {HsQueryPopupServiceModel} from './query-popup.service.model';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {HsQueryVectorService} from 'hslayers-ng/shared/query';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupService
  extends HsQueryPopupBaseService
  implements HsQueryPopupServiceModel
{
  constructor(
    public hsMapService: HsMapService,
    private hsConfig: HsConfig,
    public hsUtilsService: HsUtilsService,
    public zone: NgZone,
    private HsQueryBaseService: HsQueryBaseService,
    public hsQueryPopupWidgetContainerService: HsQueryPopupWidgetContainerService,
    private hsQueryVectorService: HsQueryVectorService,
  ) {
    super(
      hsMapService,
      hsUtilsService,
      zone,
      hsQueryPopupWidgetContainerService,
    );

    this.hsMapService.loaded().then((map) => {
      if (
        this.hsConfig.popUpDisplay &&
        this.hsConfig.popUpDisplay === 'hover'
      ) {
        map.on(
          'pointermove',
          this.hsUtilsService.debounce(
            (e) => this.preparePopup(e),
            200,
            false,
            this,
          ),
        );
      } else if (
        this.hsConfig.popUpDisplay &&
        this.hsConfig.popUpDisplay === 'click'
      ) {
        map.on(
          'singleclick',
          this.hsUtilsService.debounce(
            (e) => this.preparePopup(e),
            200,
            false,
            this,
          ),
        );
      }
    });
  }

  /**
   * Register and set hover popup overlay
   * @param nativeElement - Popup HTML content
   */
  registerPopup(nativeElement: HTMLElement): void {
    this.hoverPopup = new Overlay({
      element: nativeElement,
    });
  }

  /**
   * Prepare popup before the display
   * Get features dependent on mouse position.
   * For cesium the features will be filled differently.
   * @param e - Mouse event over the OL map
   */
  preparePopup(e: {
    map: Map;
    pixel: number[];
    dragging?: any;
    originalEvent?: any;
  }): void {
    // The latter case happens when hovering over the pop-up itself
    if (e.dragging || e.originalEvent?.target?.tagName != 'CANVAS') {
      return;
    }
    if (
      !this.HsQueryBaseService.queryActive &&
      this.hsConfig.popUpDisplay === 'click'
    ) {
      return;
    }
    let tmpFeatures = this.HsQueryBaseService.getFeaturesUnderMouse(
      e.map,
      e.pixel,
    );
    if (this.hsConfig.popUpDisplay === 'click') {
      /* Theres a separate process for selecting features 
    by select interaction not by pixel which is better for point features. 
    Merge those results */
      tmpFeatures = [
        ...this.hsQueryVectorService.selector
          .getFeatures()
          .getArray()
          .filter((f) => !tmpFeatures.includes(f)),
        ...tmpFeatures,
      ];
    }

    if (
      tmpFeatures.some(
        (f) => !this.featuresUnderMouse.includes(f as Feature<Geometry>),
      ) ||
      this.featuresUnderMouse.some((f) => !tmpFeatures.includes(f))
    ) {
      this.fillFeatures(tmpFeatures as Feature<Geometry>[]);
    }
    this.showPopup(e);
  }

  /**
   * Set popups position according to pixel where mouse is
   * @param e - Event, which triggered this function
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
