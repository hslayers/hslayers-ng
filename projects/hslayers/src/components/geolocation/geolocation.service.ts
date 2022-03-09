import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Rotate from 'ol/control/Rotate';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Circle as CircleGeom, Geometry, Point} from 'ol/geom';
import {Injectable} from '@angular/core';
import {Vector} from 'ol/source';
import {toRadians} from 'ol/math';

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
  /**
   * @public
   * @type {boolean} false
   * @description Represents geolocalization state (on/off)
   */
  localization = false;
  /**
   * @public
   * @type {boolean} false
   * @description Represents geolocalization tracking option (on/off).
   * Used to determine state of tracking in directive's html
   */
  following = false;
  gn = null;
  positionFeature: Feature<Point>;
  /**
   * @public
   * @description Turns off position centering while 'following'.
   */
  centering: boolean;
  accuracyFeature: Feature<CircleGeom>;
  geolocation: any;
  clicked: any;
  cancelClick: boolean;
  style: any;
  position_layer: any;
  constructor(
    public HsMapService: HsMapService,
    public HsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public HsUtilsService: HsUtilsService
  ) {
    this.accuracyFeature = new Feature({
      known: false,
      geometry: new CircleGeom([0, 0], 1),
    }) as Feature<CircleGeom>;
    this.positionFeature = new Feature({
      known: false,
      geometry: new Point([0, 0]),
    }) as Feature<Point>;
    this.style = new Style({
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
    this.HsMapService.loaded().then((map) => this.init(map));
  }
  getRotate(): any {
    for (const control of this.HsMapService.getMap().getControls().getArray()) {
      if (control instanceof Rotate) {
        return control;
      }
    }
  }

  /**
   * @public
   * @description Reset all geolocalization parameters concerning position tracking
   */
  stopTracking(): void {
    this.following = false;
    const rotate = this.getRotate();
    rotate.element.classList.add('hidden');
    this.HsMapService.getMap().on('pointermove', () => {
      this.centering = false;
    });
    this.geolocation.setTracking(false);
    if (this.gn !== null) {
      this.gn.stop();
    }
    this.HsMapService.getMap().getView().setRotation(0);
  }

  /**
   * @public
   * @description Toggles tracking/following
   * Takes care of the distinction between click and double-click on mobile
   */
  toggleTracking(): any {
    if (this.clicked) {
      this.cancelClick = true;
      if (this.HsLayoutService.sidebarBottom()) {
        this.HsLayoutService.contentWrapper
          .querySelector('.hs-locationButton')
          .dispatchEvent(new Event('dblclick'));
      }
      return;
    }
    this.clicked = true;
    setTimeout(() => {
      if (this.cancelClick) {
        this.cancelClick = false;
        this.clicked = false;
        return;
      }
      if (this.isCentered()) {
        if (!this.following) {
          //position
          this.geolocation.on('change:position', () => this.setNewPosition());
          this.geolocation.setTracking(true);
          this.following = true;
          //rotation
          this.setRotation();
          this.geolocation.on('change:heading', () => this.newRotation());
          this.centering = true;

          this.HsMapService.getMap().on('pointermove', () => {
            this.centering = false;
          });
          const rotate = this.getRotate();
          rotate.element.classList.remove('hidden');
          this.HsLayoutService.contentWrapper
            .querySelector('button.ol-rotate')
            .classList.add('active');
        } else {
          this.HsLayoutService.contentWrapper
            .querySelector('button.ol-rotate')
            .classList.remove('active');
          this.stopTracking();
        }
      } else {
        if (this.geolocation.getPosition()) {
          this.HsMapService.getMap()
            .getView()
            .setCenter(this.geolocation.getPosition());
          this.centering = true;
        }
      }

      //clean up
      this.cancelClick = false;
      this.clicked = false;
    }, 500);
  }

  /**
   * @public
   * @description Reset all geolocalization parameters
   */
  stopLocalization(): void {
    this.localization = false;
    this.HsMapService.getMap().removeLayer(this.position_layer);
    this.stopTracking();
  }
  /**
   * @public
   * @description Display current position by querying geolocation, once
   */
  startLocalization(): void {
    if (!this.localization) {
      this.geolocation.setTracking(true);
      this.localization = true;
      this.geolocation.once('change:position', () => {
        this.setNewPosition();
        this.HsMapService.getMap()
          .getView()
          .setCenter(this.geolocation.getPosition());
        this.HsMapService.getMap().addLayer(this.position_layer);
        this.position_layer.setZIndex(99);

        //stop tracking position
        this.geolocation.setTracking(false);
      });
    }
  }

  /**
   * @public
   * @description Function which determines whether map is centered on current position or not
   */
  isCentered(): any {
    return (
      JSON.stringify(this.HsMapService.getMap().getView().getCenter()) ===
      JSON.stringify(this.positionFeature.getGeometry().getCoordinates())
    );
  }
  /**
   * @public
   * @description Callback function handling geolocation change:position event
   */
  setNewPosition(): void {
    const position = this.geolocation.getPosition();
    this.positionFeature.getGeometry().setCoordinates(position);
    this.accuracyFeature
      .getGeometry()
      .setCenterAndRadius(position, this.geolocation.getAccuracy());
    if (this.centering) {
      this.HsMapService.getMap().getView().setCenter(position);
    }
  }
  /**
   * @public
   * @description Callback function handling geolocation change:heading event
   * @param e
   */
  newRotation(): void {
    this.HsUtilsService.debounce(
      () => {
        const heading = this.geolocation.getHeading()
          ? this.geolocation.getHeading()
          : null;
        if (heading) {
          this.HsMapService.getMap().getView().setRotation(heading);
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
   * @param map
   * @public
   * @description Init function of service, establish instance of geolocation object and layer.
   * Sets rotate map control.
   */
  init(map: any): void {
    this.geolocation = new Geolocation({
      projection: this.HsMapService.getCurrentProj(),
      trackingOptions: {
        enableHighAccuracy: true,
      },
    });

    this.accuracyFeature.setStyle(this.style);
    this.positionFeature.setStyle(this.style);

    this.position_layer = new VectorLayer({
      source: new Vector(),
    });
    setTitle(this.position_layer, 'Position');
    setShowInLayerManager(this.position_layer, false);
    setRemovable(this.position_layer, false);
    const src = this.position_layer.getSource();

    src.addFeature(this.accuracyFeature);
    src.addFeature(this.positionFeature);
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
