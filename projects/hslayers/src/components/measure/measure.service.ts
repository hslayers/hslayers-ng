import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Draw} from 'ol/interaction';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry, LineString, Polygon} from 'ol/geom';
import {Injectable} from '@angular/core';

import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService, Measurement} from '../utils/utils.service';
import {setTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsMeasureService {
  draw: Draw;
  data = {
    measurements: [],
    multipleShapeMode: false,
  };
  /**
   * @property {Feature[]} sketches Array of measure sketches
   */
  sketches: Feature<Geometry>[] = [];
  lastMeasurementId: number;
  measureVector = new VectorLayer({
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

  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService
  ) {
    setTitle(this.measureVector, 'Measurement sketches');
  }

  /**
   * @public
   * @param {boolean?} mode Optional parameter if multiple shape mode should be enabled
   * @description Enable/disable multiple shape mode for measuring (switch without parameter)
   */
  switchMultipleMode(mode?: boolean): void {
    if (mode !== undefined) {
      this.data.multipleShapeMode = mode;
    } else {
      this.data.multipleShapeMode = !this.data.multipleShapeMode;
    }
  }

  /**
   * @public
   * @param {string} type Geometry type of measurement ('area' for polygon, 'line' for linestring)
   * @description Change geometry type of measurement without deleting of old ones
   */
  changeMeasureParams(type: string, app: string): void {
    this.HsMapService.getMap(app).removeInteraction(this.draw);
    this.sketches = [];
    this.addInteraction(type, app);
  }

  /**
   * @public
   * @description Clear all measurements and restart measuring
   */
  clearMeasurement(): void {
    this.draw.setActive(false);
    this.data.measurements = [];
    this.measureVector.getSource().clear();
    this.sketches = [];
    this.draw.setActive(true);
  }

  /**
   * @public
   * @param type
   * @description Start measuring interaction in app
   */
  activateMeasuring(type: string, app: string): void {
    const map = this.HsMapService.getMap(app);
    if (!map) {
      setTimeout(() => {
        this.activateMeasuring(type, app);
      }, 500);
      return;
    }
    map.addLayer(this.measureVector);
    map.getViewport().addEventListener('mousemove', (evt) => {
      this.mouseMoveHandler(evt);
    });
    map.getViewport().addEventListener('touchmove', (evt) => {
      this.mouseMoveHandler(evt);
    });
    map.getViewport().addEventListener('touchend', (evt) => {
      this.mouseMoveHandler(evt);
    });

    this.addInteraction(type, app);
  }

  /**
   * @public
   * @description Stop measuring interaction in app
   */
  deactivateMeasuring(app: string): void {
    this.HsMapService.loaded(app).then((map) => {
      map.getViewport().removeEventListener('mousemove', (evt) => {
        this.mouseMoveHandler(evt);
      });
      map.getViewport().removeEventListener('touchmove', (evt) => {
        this.mouseMoveHandler(evt);
      });
      map.getViewport().removeEventListener('touchend', (evt) => {
        this.mouseMoveHandler(evt);
      });

      map.removeInteraction(this.draw);
      map.removeLayer(this.measureVector);
    });
    this.HsEventBusService.measurementEnds.next({app}); //better emit drawingEnds here
  }

  /**
   * @private
   * @param {object} evt Callback param for mouse move event
   * @description Callback for mouse and touch move event, compute live measurement results
   */
  mouseMoveHandler(evt): void {
    if (this.sketches.length > 0) {
      let output: Measurement;

      for (const sketch of this.sketches) {
        const geom = sketch.getGeometry();
        if (this.HsUtilsService.instOf(geom, Polygon)) {
          output = this.addMultiple(
            this.HsUtilsService.formatArea(
              geom as Polygon,
              this.HsMapService.getCurrentProj()
            ),
            output
          );
        } else if (this.HsUtilsService.instOf(geom, LineString)) {
          output = this.addMultiple(
            this.HsUtilsService.formatLength(
              geom as LineString,
              this.HsMapService.getCurrentProj()
            ),
            output
          );
        }
      }
      //output.geom = this.sketch;
      setTimeout(() => {
        this.data.measurements[this.lastMeasurementId] = output;
      }, 0);
    }
  }

  /**
   * @private
   * @param {Measurement} val1 Output of new object
   * @param {Measurement} val2 Old value
   * @returns {Measurement}
   * @description Adds two measure results for multiple shape mode to display joined result
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
   * @private
   * @param {string} type Geometry type
   * @description Initialize draw interaction on Ol.map and event handlers for handling start and end of drawing
   */
  addInteraction(type: string, app: string): void {
    const drawType = type == 'area' ? 'Polygon' : 'LineString';
    this.draw = new Draw({
      source: this.measureVector.getSource(),
      type: /** @type {GeometryType} */ drawType,
      dragVertexDelay: 150,
    });
    this.HsMapService.getMap(app).addInteraction(this.draw);

    this.draw.on('drawstart', (evt) => {
      this.HsEventBusService.measurementStarts.next({app});
      if (this.data.multipleShapeMode) {
        if (!Array.isArray(this.sketches)) {
          this.sketches = [];
          this.data.measurements.push({
            size: 0,
            unit: '',
          });
        }
        this.sketches.push(evt.feature);
      } else {
        this.sketches = [evt.feature];
        this.data.measurements.push({
          size: 0,
          unit: '',
        });
      }
      this.lastMeasurementId = this.data.measurements.length - 1;
    });

    this.draw.on('drawend', (evt) => {
      this.HsEventBusService.measurementEnds.next({app});
    });
  }
}
