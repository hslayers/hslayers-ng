import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Rotate from 'ol/control/Rotate';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Circle as CircleGeom, Point} from 'ol/geom';
import {Injectable} from '@angular/core';
import {Vector} from 'ol/source';
import {toRadians} from 'ol/math';

import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from './../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsGeolocationService {
  /**
   * @ngdoc property
   * @name HsGeolocationService#localization
   * @public
   * @type {boolean} false
   * @description Represents geolocalization state (on/off)
   */
  localization = false;
  /**
   * @ngdoc property
   * @name HsGeolocationService#following
   * @public
   * @type {boolean} false
   * @description Represents geolocalization tracking option (on/off).
   * Used to deremine state of tracking in directive's html
   */
  following = false;
  gn = null;
  positionFeature: Feature;
  /**
   * @ngdoc method
   * @name HsGeolocationService#stopCentering
   * @public
   * @description Turns off position centering while 'following'.
   */
  centering: boolean;
  accuracyFeature: Feature;
  geolocation: any;
  clicked: any;
  cancelClick: boolean;
  style: any;
  position_layer: any;
  constructor(
    public HsMapService: HsMapService,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService
  ) {
    this.accuracyFeature = new Feature({
      known: false,
      geometry: new CircleGeom([0, 0], 1),
    });
    this.positionFeature = new Feature({
      known: false,
      geometry: new Point([0, 0]),
    });
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
  getRotate(): Rotate {
    for (const control of this.HsMapService.map.getControls().getArray()) {
      if (control instanceof Rotate) {
        return control;
      }
    }
  }

  /**
   * @ngdoc method
   * @name HsGeolocationService#stopTracking
   * @public
   * @description Reset all geolocalization parameters concerning position tracking
   */
  stopTracking(): void {
    this.following = false;
    const rotate = this.getRotate();
    rotate.element.classList.add('hidden');
    this.HsMapService.map.on('pointermove', () => {
      this.centering = false;
    });
    this.geolocation.setTracking(false);
    if (this.gn !== null) {
      this.gn.stop();
    }
    this.HsMapService.map.getView().setRotation(0);
  }

  /**
   * @ngdoc method
   * @name HsGeolocationService#stopTracking
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

          this.HsMapService.map.on('pointermove', () => {
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
          this.HsMapService.map
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
   * @ngdoc method
   * @name HsGeolocationService#stopLocalization
   * @public
   * @description Reset all geolocalization parameters
   */
  stopLocalization(): void {
    this.localization = false;
    this.HsMapService.map.removeLayer(this.position_layer);
    this.stopTracking();
  }
  /**
   * @ngdoc method
   * @name HsGeolocationService#startLocalization
   * @public
   * @description Display current position by querying geolocation, once
   */
  startLocalization(): void {
    if (!this.localization) {
      this.geolocation.setTracking(true);
      this.localization = true;
      this.geolocation.once('change:position', () => {
        this.setNewPosition();
        this.HsMapService.map
          .getView()
          .setCenter(this.geolocation.getPosition());
        this.HsMapService.map.addLayer(this.position_layer);
        this.position_layer.setZIndex(99);

        //stop tracking positon
        this.geolocation.setTracking(false);
      });
    }
  }

  /**
   * @ngdoc method
   * @name HsGeolocationService#isCentered
   * @public
   * @description Function which determines whether map is centered on current postion or not
   */
  isCentered(): any {
    return (
      JSON.stringify(this.HsMapService.map.getView().getCenter()) ===
      JSON.stringify(this.positionFeature.getGeometry().getCoordinates())
    );
  }
  /**
   * @ngdoc method
   * @name HsGeolocationService#setNewPosition
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
      this.HsMapService.map.getView().setCenter(position);
    }
  }
  /**
   * @ngdoc method
   * @name HsGeolocationService#newRotation
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
          this.HsMapService.map.getView().setRotation(heading);
        }
      },
      150,
      false,
      this
    );
  }

  setRotation(): void {
   console.error('Device rotation tracking currently not implemented')
  }
  /**
   * @param map
   * @ngdoc method
   * @name HsGeolocationService#init
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
      title: 'Position',
      showInLayerManager: false,
      removable: false,
      source: new Vector(),
    });
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
