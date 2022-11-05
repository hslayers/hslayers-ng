import {Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Rotate from 'ol/control/Rotate';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Circle as CircleGeom, Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';

import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from './../utils/utils.service';
import {
  setRemovable,
  setShowInLayerManager,
  setTitle,
} from '../../common/layer-extensions';

class HsGeolocationParams {
  /**
   * Represents geolocalization state (on/off)
   */
  centering: boolean;
  accuracyFeature: Feature<CircleGeom>;
  geolocation: any;
  clicked: any;
  cancelClick: boolean;
  style: any;
  position_layer: any;

  localization = false;
  /**
   * Represents geolocalization tracking option (on/off).
   * Used to determine state of tracking in directive's html
   */
  following = false;
  gn: any;
  positionFeature: Feature<Point>;
  /**

   * Turns off position centering while 'following'.
   */
}
@Injectable({
  providedIn: 'root',
})
export class HsGeolocationService {
  apps: {
    [id: string]: HsGeolocationParams;
  } = {default: new HsGeolocationParams()};

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
    this.get(app).accuracyFeature = new Feature({
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
    this.get(app).positionFeature = new Feature({
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
    this.get(app).style = new Style({
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
   * Get app instance service params
   * @param app - App identifier
   */
  get(app: string): HsGeolocationParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsGeolocationParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * @public
   * Reset all geolocalization parameters concerning position tracking
   * @param app - App identifier
   */
  stopTracking(app: string): void {
    const appRef = this.get(app);
    appRef.following = false;
    const rotate = this.getRotate(app);
    rotate.element.classList.add('hidden');
    this.HsMapService.getMap(app).on('pointermove', () => {
      appRef.centering = false;
    });
    appRef.geolocation.setTracking(false);
    if (appRef.gn !== null) {
      appRef.gn.stop();
    }
    this.HsMapService.getMap(app).getView().setRotation(0);
  }

  /**
   * @public
   * Toggles tracking/following
   * Takes care of the distinction between click and double-click on mobile
   * @param app - App identifier
   */
  async toggleTracking(app: string): Promise<void> {
    const appRef = this.get(app);
    if (appRef.clicked) {
      appRef.cancelClick = true;
      if (
        (await lastValueFrom(this.HsLayoutService.sidebarPosition)).position ==
        'bottom'
      ) {
        this.HsLayoutService.get(app)
          .contentWrapper.querySelector('.hs-locationButton')
          .dispatchEvent(new Event('dblclick'));
      }
      return;
    }
    appRef.clicked = true;
    setTimeout(() => {
      if (appRef.cancelClick) {
        appRef.cancelClick = false;
        appRef.clicked = false;
        return;
      }
      if (this.isCentered(app)) {
        if (!appRef.following) {
          //position
          appRef.geolocation.on('change:position', () =>
            this.setNewPosition(app)
          );
          appRef.geolocation.setTracking(true);
          appRef.following = true;
          //rotation
          this.setRotation();
          appRef.geolocation.on('change:heading', () => this.newRotation(app));
          appRef.centering = true;

          this.HsMapService.getMap(app).on('pointermove', () => {
            appRef.centering = false;
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
        if (appRef.geolocation.getPosition()) {
          this.HsMapService.getMap(app)
            .getView()
            .setCenter(appRef.geolocation.getPosition());
          appRef.centering = true;
        }
      }

      //clean up
      appRef.cancelClick = false;
      appRef.clicked = false;
    }, 500);
  }

  /**
   * @public
   * Reset all geolocalization parameters
   * @param app - App identifier
   */
  stopLocalization(app: string): void {
    const appRef = this.get(app);
    appRef.localization = false;
    this.HsMapService.getMap(app).removeLayer(appRef.position_layer);
    this.stopTracking(app);
  }
  /**
   * @public
   * Display current position by querying geolocation, once
   * @param app - App identifier
   */
  startLocalization(app: string): void {
    const appRef = this.get(app);
    if (!appRef.localization) {
      appRef.geolocation.setTracking(true);
      appRef.localization = true;
      appRef.geolocation.once('change:position', () => {
        this.setNewPosition(app);
        this.HsMapService.getMap(app)
          .getView()
          .setCenter(appRef.geolocation.getPosition());
        this.HsMapService.getMap(app).addLayer(appRef.position_layer);
        appRef.position_layer.setZIndex(99);

        //stop tracking position
        appRef.geolocation.setTracking(false);
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
        this.get(app).positionFeature.getGeometry().getCoordinates()
      )
    );
  }
  /**
   * @public
   * Callback function handling geolocation change:position event
   * @param app - App identifier
   */
  setNewPosition(app: string): void {
    const appRef = this.get(app);
    const position = appRef.geolocation.getPosition();
    appRef.positionFeature.getGeometry().setCoordinates(position);
    appRef.accuracyFeature
      .getGeometry()
      .setCenterAndRadius(position, appRef.geolocation.getAccuracy());
    if (appRef.centering) {
      this.HsMapService.getMap(app).getView().setCenter(position);
    }
  }
  /**
   * @public
   * Callback function handling geolocation change:heading event
   * @param app - App identifier
   */
  newRotation(app: string): void {
    const appRef = this.get(app);
    this.HsUtilsService.debounce(
      () => {
        const heading = appRef.geolocation.getHeading()
          ? appRef.geolocation.getHeading()
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
    const appRef = this.get(app);
    this.setAccuracyFeature(app);
    this.setPositionFeature(app);
    this.setStyle(app);
    await this.HsMapService.loaded(app);
    const map = this.HsMapService.getMap(app);
    appRef.geolocation = new Geolocation({
      projection: this.HsMapService.getCurrentProj(app),
      trackingOptions: {
        enableHighAccuracy: true,
      },
    });

    appRef.accuracyFeature.setStyle(appRef.style);
    appRef.positionFeature.setStyle(appRef.style);

    appRef.position_layer = new VectorLayer({
      source: new Vector(),
    });
    setTitle(appRef.position_layer, 'Position');
    setShowInLayerManager(appRef.position_layer, false);
    setRemovable(appRef.position_layer, false);
    const src = appRef.position_layer.getSource();

    src.addFeature(appRef.accuracyFeature);
    src.addFeature(appRef.positionFeature);
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
