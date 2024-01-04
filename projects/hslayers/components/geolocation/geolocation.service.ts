import {Injectable} from '@angular/core';

import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Circle as CircleGeom, Point} from 'ol/geom';
import {Feature, Geolocation} from 'ol';
import {Rotate} from 'ol/control';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';

import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {
  setRemovable,
  setShowInLayerManager,
  setTitle,
} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsGeolocationService {
  /**
   * Represents geolocation state (on/off)
   */
  centering: boolean;
  accuracyFeature: Feature<CircleGeom>;
  geolocation: any;
  clicked: any;
  cancelClick: boolean;
  style: any;
  position_layer: any;

  localization = false;

  trackOrientation = false;
  orientationListener: EventListenerObject;
  /**
   * Represents geolocation tracking option (on/off).
   * Used to determine state of tracking in directive's html
   */
  following = false;
  gn: any;
  positionFeature: Feature<Point>;
  /**
   * Turns off position centering while 'following'.
   */
  constructor(
    public HsMapService: HsMapService,
    public HsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public HsUtilsService: HsUtilsService,
  ) {
    this.setAccuracyFeature();
    this.setPositionFeature();
    this.setStyle();

    this.HsMapService.loaded().then((map) => {
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

      map.addControl(
        new Rotate({
          resetNorth: this.toggleOrientation.bind(this),
          className: 'ol-rotate hidden',
          autoHide: false,
        }),
      );
    });
  }

  /**
   * Reset all geolocation parameters concerning position tracking
   */
  stopTracking(): void {
    this.following = false;
    const rotate = this.getRotate();
    rotate.element.classList.add('hidden');
    this.geolocation.setTracking(false);
    this.HsMapService.getMap().getView().setRotation(0);
  }

  /**
   * Toggles tracking/following
   * Takes care of the distinction between click and double-click on mobile
   */
  async toggleTracking(): Promise<void> {
    if (this.clicked) {
      this.cancelClick = true;
      if (this.HsLayoutService.sidebarPosition$.getValue() == 'bottom') {
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
          this.toggleOrientation();
        } else {
          this.stopTracking();
          this.toggleOrientation();
        }
      } else {
        const position = this.geolocation.getPosition();
        if (position) {
          this.HsMapService.getMap().getView().setCenter(position);
        }
      }

      //clean up
      this.cancelClick = false;
      this.clicked = false;
    }, 500);
  }

  /**
   * Reset all geolocation parameters
   */
  stopLocalization(): void {
    this.localization = false;
    this.HsMapService.getMap().removeLayer(this.position_layer);
    this.stopTracking();
    if (this.trackOrientation) {
      this.toggleOrientation();
    }
  }

  /**
   * Display current position by querying geolocation, once
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
   * Function which determines whether map is centered on current position or not
   */
  isCentered(): any {
    return (
      JSON.stringify(this.HsMapService.getMap().getView().getCenter()) ===
      JSON.stringify(this.positionFeature.getGeometry().getCoordinates())
    );
  }

  /**
   * Callback function handling geolocation change:position event
   */
  setNewPosition(): void {
    const position = this.geolocation.getPosition();
    this.positionFeature.getGeometry().setCoordinates(position);
    this.accuracyFeature
      .getGeometry()
      .setCenterAndRadius(position, this.geolocation.getAccuracy());
    this.HsMapService.getMap().getView().setCenter(position);
  }

  toggleOrientation(): void {
    this.trackOrientation = !this.trackOrientation;
    this.HsLayoutService.contentWrapper
      .querySelector('button.ol-rotate')
      .classList.toggle('active');

    if (this.trackOrientation) {
      const rotate = this.getRotate();
      rotate.element.classList.remove('hidden');

      this.orientationListener = this.handleOrientation.bind(this);
      window.addEventListener('deviceorientation', this.orientationListener);
    } else {
      window.removeEventListener('deviceorientation', this.orientationListener);
      const view = this.HsMapService.getMap().getView();
      view.setRotation(0);
    }
  }

  /**
   * Orientation change handler
   */
  handleOrientation(event: DeviceOrientationEvent) {
    const alpha = event.alpha ?? 0;
    this.HsMapService.getMap()
      .getView()
      .setRotation((360 - alpha) * (Math.PI / 180));
  }

  /**
   * Get map rotate control
   */
  private getRotate(): any {
    for (const control of this.HsMapService.getMap().getControls().getArray()) {
      if (control instanceof Rotate) {
        return control;
      }
    }
  }

  /**
   * Set accuracy feature
   */
  private setAccuracyFeature(): void {
    this.accuracyFeature = new Feature({
      known: false,
      geometry: new CircleGeom([0, 0], 1),
    }) as Feature<CircleGeom>;
  }

  /**
   * Set position feature
   */
  private setPositionFeature(): void {
    this.positionFeature = new Feature({
      known: false,
      geometry: new Point([0, 0]),
    }) as Feature<Point>;
  }

  /**
   * Set feature style
   */
  private setStyle(): void {
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
  }
}
