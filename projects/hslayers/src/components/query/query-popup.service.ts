import {Injectable, NgZone} from '@angular/core';

import {Feature, Map, Overlay} from 'ol';
import {Geometry} from 'ol/geom';

import {HsConfig} from '../../config.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryPopupBaseService} from './query-popup-base.service';
import {HsQueryPopupServiceModel} from './query-popup.service.model';
import {HsQueryPopupWidgetContainerService} from './query-popup-widget-container.service';
import {HsQueryVectorService} from './query-vector.service';
import {HsUtilsService} from '../utils/utils.service';

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
    private hsQueryVectorService: HsQueryVectorService
  ) {
    super(
      hsMapService,
      hsUtilsService,
      zone,
      hsQueryPopupWidgetContainerService
    );
  }

  /**
   * Register and set hover popup overlay
   * @param nativeElement - Popup HTML content
   * @param app - App identifier
   */
  registerPopup(nativeElement: HTMLElement, app: string): void {
    this.setAppIfNeeded(app);
    this.apps[app].hoverPopup = new Overlay({
      element: nativeElement,
    });
  }

  /**
   * Initialize the query popup service data and subscribers
   * @param app - App identifier
   */
  async init(app: string): Promise<void> {
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
   * Prepare popup before the display
   * Get features dependent on mouse position.
   * For cesium the features will be filled differently.
   * @param e - Mouse event over the OL map
   * @param app - App identifier
   */
  preparePopup(
    e: {
      map: Map;
      pixel: number[];
      dragging?: any;
      originalEvent?: any;
    },
    app: string
  ): void {
    // The latter case happens when hovering over the pop-up itself
    if (e.dragging || e.originalEvent?.target?.tagName != 'CANVAS') {
      return;
    }
    if (
      !this.HsQueryBaseService.get(app).queryActive &&
      this.hsConfig.get(app).popUpDisplay === 'click'
    ) {
      return;
    }
    let tmpFeatures = this.HsQueryBaseService.getFeaturesUnderMouse(
      e.map,
      e.pixel,
      app
    );
    if (this.hsConfig.get(app).popUpDisplay === 'click') {
      /* Theres a separate process for selecting features 
    by select interaction not by pixel which is better for point features. 
    Merge those results */
      tmpFeatures = [
        ...this.hsQueryVectorService
          .get(app)
          .selector.getFeatures()
          .getArray()
          .filter((f) => !tmpFeatures.includes(f)),
        ...tmpFeatures,
      ];
    }

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
   * @param app - App identifier
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
