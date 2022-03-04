import {Injectable} from '@angular/core';

import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Rotate from 'ol/control/Rotate';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Circle as CircleGeom, Point} from 'ol/geom';
import {Vector} from 'ol/source';

import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from './../utils/utils.service';
import {
  setRemovable,
  setShowInLayerManager,
  setTitle,
} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsGeolocationService {
  apps: {
    [key: string]: {
      /**
       * Represents geolocalization state (on/off)
       */
      localization: boolean;
      // localization = false;
      /**
       * Represents geolocalization tracking option (on/off).
       * Used to determine state of tracking in directive's html
       */
      following: boolean;
      // following = false;
      gn: any;
      // gn = null;
      positionFeature: Feature<Point>;
      /**

   * Turns off position centering while 'following'.
   */
      centering: boolean;
      accuracyFeature: Feature<CircleGeom>;
      geolocation: any;
      clicked: any;
      cancelClick: boolean;
      style: any;
      position_layer: any;
    };
  } = {};

  constructor(
    public HsMapService: HsMapService,
    public HsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public HsUtilsService: HsUtilsService
  ) {}

  /**
   * @public
   * Get map rotate control
   * @param app - App identifier
   */
  getRotate(app: string): any {
    for (const control of this.HsMapService.getMap(app)
      .getControls()
      .getArray()) {
      if (control instanceof Rotate) {
        return control;
      }
    }
  }

  /**
   * @public
   * Set accuracy feature
   * @param app - App identifier
   */
  setAccuracyFeature(app: string): void {
    this.apps[app].accuracyFeature = new Feature({
      known: false,
      geometry: new CircleGeom([0, 0], 1),
    }) as Feature<CircleGeom>;
  }

  /**
   * @public
   * Set position feature
   * @param app - App identifier
   */
  setPositionFeature(app: string): void {
    this.apps[app].positionFeature = new Feature({
      known: false,
      geometry: new Point([0, 0]),
    }) as Feature<Point>;
  }

  /**
   * @public
   * Set feature style
   * @param app - App identifier
   */
  setStyle(app: string): void {
    this.apps[app].style = new Style({
      image: new Circle({
        fill: new Fill({
          color: [242, 121, 0, 0.7],
        }),
        stroke: new Stroke({
          color: [0xbb, 0x33, 0x33, 0.7],
        }),
        radius: 5,
      }),
      fill: new Fill({
        color: [0xbb, 0xbb, 0xbb, 0.2],
      }),
      stroke: new Stroke({
        color: [0x66, 0x66, 0x00, 0.8],
      }),
    });
  }

  /**
   * @public
   * Reset all geolocalization parameters concerning position tracking
   * @param app - App identifier
   */
  stopTracking(app: string): void {
    this.apps[app].following = false;
    const rotate = this.getRotate(app);
    rotate.element.classList.add('hidden');
    this.HsMapService.getMap(app).on('pointermove', () => {
      this.apps[app].centering = false;
    });
    this.apps[app].geolocation.setTracking(false);
    if (this.apps[app].gn !== null) {
      this.apps[app].gn.stop();
    }
    this.HsMapService.getMap(app).getView().setRotation(0);
  }

  /**
   * @public
   * Toggles tracking/following
   * Takes care of the distinction between click and double-click on mobile
   * @param app - App identifier
   */
  toggleTracking(app: string): any {
    if (this.apps[app].clicked) {
      this.apps[app].cancelClick = true;
      if (this.HsLayoutService.sidebarBottom()) {
        this.HsLayoutService.get(app)
          .contentWrapper.querySelector('.hs-locationButton')
          .dispatchEvent(new Event('dblclick'));
      }
      return;
    }
    this.apps[app].clicked = true;
    setTimeout(() => {
      if (this.apps[app].cancelClick) {
        this.apps[app].cancelClick = false;
        this.apps[app].clicked = false;
        return;
      }
      if (this.isCentered(app)) {
        if (!this.apps[app].following) {
          //position
          this.apps[app].geolocation.on('change:position', () =>
            this.setNewPosition(app)
          );
          this.apps[app].geolocation.setTracking(true);
          this.apps[app].following = true;
          //rotation
          this.setRotation();
          this.apps[app].geolocation.on('change:heading', () =>
            this.newRotation(app)
          );
          this.apps[app].centering = true;

          this.HsMapService.getMap(app).on('pointermove', () => {
            this.apps[app].centering = false;
          });
          const rotate = this.getRotate(app);
          rotate.element.classList.remove('hidden');
          this.HsLayoutService.get(app)
            .contentWrapper.querySelector('button.ol-rotate')
            .classList.add('active');
        } else {
          this.HsLayoutService.get(app)
            .contentWrapper.querySelector('button.ol-rotate')
            .classList.remove('active');
          this.stopTracking(app);
        }
      } else {
        if (this.apps[app].geolocation.getPosition()) {
          this.HsMapService.getMap(app)
            .getView()
            .setCenter(this.apps[app].geolocation.getPosition());
          this.apps[app].centering = true;
        }
      }

      //clean up
      this.apps[app].cancelClick = false;
      this.apps[app].clicked = false;
    }, 500);
  }

  /**
   * @public
   * Reset all geolocalization parameters
   * @param app - App identifier
   */
  stopLocalization(app: string): void {
    this.apps[app].localization = false;
    this.HsMapService.getMap(app).removeLayer(this.apps[app].position_layer);
    this.stopTracking(app);
  }
  /**
   * @public
   * Display current position by querying geolocation, once
   * @param app - App identifier
   */
  startLocalization(app: string): void {
    if (!this.apps[app].localization) {
      this.apps[app].geolocation.setTracking(true);
      this.apps[app].localization = true;
      this.apps[app].geolocation.once('change:position', () => {
        this.setNewPosition(app);
        this.HsMapService.getMap(app)
          .getView()
          .setCenter(this.apps[app].geolocation.getPosition());
        this.HsMapService.getMap(app).addLayer(this.apps[app].position_layer);
        this.apps[app].position_layer.setZIndex(99);

        //stop tracking position
        this.apps[app].geolocation.setTracking(false);
      });
    }
  }

  /**
   * @public
   * Function which determines whether map is centered on current position or not
   * @param app - App identifier
   */
  isCentered(app: string): any {
    return (
      JSON.stringify(this.HsMapService.getMap(app).getView().getCenter()) ===
      JSON.stringify(
        this.apps[app].positionFeature.getGeometry().getCoordinates()
      )
    );
  }
  /**
   * @public
   * Callback function handling geolocation change:position event
   * @param app - App identifier
   */
  setNewPosition(app: string): void {
    const position = this.apps[app].geolocation.getPosition();
    this.apps[app].positionFeature.getGeometry().setCoordinates(position);
    this.apps[app].accuracyFeature
      .getGeometry()
      .setCenterAndRadius(position, this.apps[app].geolocation.getAccuracy());
    if (this.apps[app].centering) {
      this.HsMapService.getMap(app).getView().setCenter(position);
    }
  }
  /**
   * @public
   * Callback function handling geolocation change:heading event
   * @param app - App identifier
   */
  newRotation(app: string): void {
    this.HsUtilsService.debounce(
      () => {
        const heading = this.apps[app].geolocation.getHeading()
          ? this.apps[app].geolocation.getHeading()
          : null;
        if (heading) {
          this.HsMapService.getMap(app).getView().setRotation(heading);
        }
      },
      150,
      false,
      this
    );
  }

  setRotation(): void {
    this.hsLog.error('Device rotation tracking currently not implemented');
  }
  /**
   * @public
   * Init function of service, establish instance of geolocation object and layer.
   * Set map rotate control.
   * @param app - App identifier
   */
  async init(app: string): Promise<void> {
    this.apps[app] = {
      localization: false,
      following: false,
      gn: null,
      positionFeature: null,
      centering: null,
      accuracyFeature: null,
      geolocation: null,
      clicked: null,
      cancelClick: null,
      style: null,
      position_layer: null,
    };
    this.setAccuracyFeature(app);
    this.setPositionFeature(app);
    this.setStyle(app);

    await this.HsMapService.loaded(app);
    const map = this.HsMapService.getMap(app);
    this.apps[app].geolocation = new Geolocation({
      projection: this.HsMapService.getCurrentProj(app),
      trackingOptions: {
        enableHighAccuracy: true,
      },
    });

    this.apps[app].accuracyFeature.setStyle(this.apps[app].style);
    this.apps[app].positionFeature.setStyle(this.apps[app].style);

    this.apps[app].position_layer = new VectorLayer({
      source: new Vector(),
    });
    setTitle(this.apps[app].position_layer, 'Position');
    setShowInLayerManager(this.apps[app].position_layer, false);
    setRemovable(this.apps[app].position_layer, false);
    const src = this.apps[app].position_layer.getSource();

    src.addFeature(this.apps[app].accuracyFeature);
    src.addFeature(this.apps[app].positionFeature);
    const reset = function () {
      if (this.gn !== undefined) {
        if (this.gn.isRunning() && this.gn !== null) {
          this.gn.stop();
          map.getView().setRotation(0);
          this.HsLayoutService.contentWrapper
            .querySelector('button.ol-rotate')
            .classList.remove('active');
        } else {
          this.setRotation();
          this.HsLayoutService.contentWrapper
            .querySelector('button.ol-rotate')
            .classList.add('active');
        }
      }
    };
    map.addControl(
      new Rotate({
        resetNorth: reset,
        className: 'ol-rotate hidden',
        autoHide: false,
      })
    );
  }
}
