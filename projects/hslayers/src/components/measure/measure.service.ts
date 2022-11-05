import {Draw} from 'ol/interaction';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry, LineString, Polygon} from 'ol/geom';
import {Injectable} from '@angular/core';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService, Measurement} from '../utils/utils.service';
import {setTitle} from '../../common/layer-extensions';

class MeasureServiceParams {
  draw: Draw;
  data = {
    measurements: [],
    multipleShapeMode: false,
  };
  /**
   * sketches Array of measure sketches
   */
  sketches: Feature<Geometry>[] = [];
  lastMeasurementId: number;
  measureVector: VectorLayer<VectorSource<Geometry>>;
  measuringActivated = false;
}
@Injectable({
  providedIn: 'root',
})
export class HsMeasureService {
  apps: {
    [id: string]: MeasureServiceParams;
  } = {default: new MeasureServiceParams()};
  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService
  ) {}

  /**
   * Initialize the map swipe service data and subscribers
   * @param app - App identifier
   */
  init(app: string): void {
    this.setMeasureLayer(app);
    setTitle(this.get(app).measureVector, 'Measurement sketches');
  }

  /**
   * Get the params saved by the measure service for the current app
   * @param app - App identifier
   */
  get(app: string): MeasureServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new MeasureServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * @public
   * @param mode - Optional parameter if multiple shape mode should be enabled
   * @param app - App identifier
   * Enable/disable multiple shape mode for measuring (switch without parameter)
   */
  switchMultipleMode(app: string, mode?: boolean): void {
    const appRef = this.get(app);
    if (mode !== undefined) {
      appRef.data.multipleShapeMode = mode;
    } else {
      appRef.data.multipleShapeMode = !appRef.data.multipleShapeMode;
    }
  }

  /**
   * Set new measure vector layer
   * @param app - App identifier
   */
  setMeasureLayer(app: string): void {
    this.get(app).measureVector = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
      }),
    });
  }

  /**
   * @public
   * @param type - Geometry type of measurement ('area' for polygon, 'line' for linestring)
   * @param app - App identifier
   * Change geometry type of measurement without deleting of old ones
   */
  changeMeasureParams(type: string, app: string): void {
    const appRef = this.get(app);
    this.HsMapService.getMap(app).removeInteraction(appRef.draw);
    appRef.sketches = [];
    this.addInteraction(type, app);
  }

  /**
   * @public
   * @param app - App identifier
   * Clear all measurements and restart measuring
   */
  clearMeasurement(app: string): void {
    const appRef = this.get(app);
    appRef.draw.setActive(false);
    appRef.data.measurements = [];
    appRef.measureVector.getSource().clear();
    appRef.sketches = [];
    appRef.draw.setActive(true);
  }

  /**
   * @public
   * @param type -
   * @param app - App identifier
   * Start measuring interaction in app
   */
  activateMeasuring(type: string, app: string): void {
    const appRef = this.get(app);
    if (appRef.measuringActivated) {
      return;
    }
    const map = this.HsMapService.getMap(app);
    if (!map) {
      setTimeout(() => {
        this.activateMeasuring(type, app);
      }, 500);
      return;
    }
    map.addLayer(appRef.measureVector);
    map.getViewport().addEventListener('mousemove', (evt) => {
      this.mouseMoveHandler(evt, app);
    });
    map.getViewport().addEventListener('touchmove', (evt) => {
      this.mouseMoveHandler(evt, app);
    });
    map.getViewport().addEventListener('touchend', (evt) => {
      this.mouseMoveHandler(evt, app);
    });

    this.addInteraction(type, app);
    appRef.measuringActivated = true;
  }

  /**
   * @public
   * @param app - App identifier
   * Stop measuring interaction in app
   */
  deactivateMeasuring(app: string): void {
    const appRef = this.get(app);
    this.HsMapService.loaded(app).then((map) => {
      map.getViewport().removeEventListener('mousemove', (evt) => {
        this.mouseMoveHandler(evt, app);
      });
      map.getViewport().removeEventListener('touchmove', (evt) => {
        this.mouseMoveHandler(evt, app);
      });
      map.getViewport().removeEventListener('touchend', (evt) => {
        this.mouseMoveHandler(evt, app);
      });

      map.removeInteraction(appRef.draw);
      map.removeLayer(appRef.measureVector);
    });
    appRef.measuringActivated = false;
    this.HsEventBusService.measurementEnds.next({app}); //better emit drawingEnds here
  }

  /**
   * @param evt - Callback param for mouse move event
   * @param app - App identifier
   * Callback for mouse and touch move event, compute live measurement results
   */
  mouseMoveHandler(evt, app: string): void {
    const appRef = this.get(app);
    if (appRef.sketches.length > 0) {
      let output: Measurement;

      for (const sketch of appRef.sketches) {
        const geom = sketch.getGeometry();
        if (this.HsUtilsService.instOf(geom, Polygon)) {
          output = this.addMultiple(
            this.HsUtilsService.formatArea(
              geom as Polygon,
              this.HsMapService.getCurrentProj(app)
            ),
            output
          );
        } else if (this.HsUtilsService.instOf(geom, LineString)) {
          output = this.addMultiple(
            this.HsUtilsService.formatLength(
              geom as LineString,
              this.HsMapService.getCurrentProj(app)
            ),
            output
          );
        }
      }
      //output.geom = this.sketch;
      setTimeout(() => {
        appRef.data.measurements[appRef.lastMeasurementId] = output;
      }, 0);
    }
  }

  /**

   * @param val1 - Output of new object
   * @param val2 - Old value
   * @returns 
   * Adds two measure results for multiple shape mode to display joined result
   */
  addMultiple(val1: Measurement, val2: Measurement): Measurement {
    if (val2 == undefined) {
      return val1;
    }
    let unit = val1.unit;
    const type = val1.type;
    let value: number;
    if (val1.unit == val2.unit) {
      value = Math.round((val1.size + val2.size) * 100) / 100;
      if (unit == 'm' && type == 'length' && value > 1000) {
        value = Math.round((value / 1000) * 100) / 100;
        unit = 'km';
      } else if (unit == 'm' && type == 'area' && value > 10000) {
        value = Math.round((value / 1000000) * 100) / 100;
        unit = 'km';
      }
    } else {
      const arr = [val1, val2];
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].unit == 'm') {
          type == 'length' ? (arr[i].size /= 1000) : (arr[i].size /= 1000000);
        }
      }
      value = Math.round((arr[0].size + arr[1].size) * 100) / 100;
      unit = 'km';
    }
    return {
      size: value,
      type: type,
      unit: unit,
    };
  }

  /**
   * @param type - Geometry type
   * @param app - App identifier
   * Initialize draw interaction on Ol.map and event handlers for handling start and end of drawing
   */
  addInteraction(type: string, app: string): void {
    const appRef = this.get(app);
    const drawType = type == 'area' ? 'Polygon' : 'LineString';
    appRef.draw = new Draw({
      source: appRef.measureVector.getSource(),
      type: /** @type {GeometryType} */ drawType,
      dragVertexDelay: 150,
    });
    this.HsMapService.getMap(app).addInteraction(appRef.draw);

    appRef.draw.on('drawstart', (evt) => {
      this.HsEventBusService.measurementStarts.next({app});
      if (appRef.data.multipleShapeMode) {
        if (!Array.isArray(appRef.sketches)) {
          appRef.sketches = [];
          appRef.data.measurements.push({
            size: 0,
            unit: '',
          });
        }
        appRef.sketches.push(evt.feature);
      } else {
        appRef.sketches = [evt.feature];
        appRef.data.measurements.push({
          size: 0,
          unit: '',
        });
      }
      appRef.lastMeasurementId = appRef.data.measurements.length - 1;
    });

    appRef.draw.on('drawend', (evt) => {
      this.HsEventBusService.measurementEnds.next({app});
    });
  }
}
