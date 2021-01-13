import * as GeometryType from 'ol/geom/GeometryType';
import VectorLayer from 'ol/layer/Vector';
import {Draw} from 'ol/interaction';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Injectable} from '@angular/core';
import {LineString, Polygon} from 'ol/geom';
import {Vector} from 'ol/source';
import {getArea, getDistance} from 'ol/sphere';
import {transform} from 'ol/proj';

import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsMeasureService {
  map;
  draw: Draw;
  data = {
    measurements: [],
    multipleShapeMode: false,
  };
  /**
   * @property {Feature[]} sketches Array of measure sketches
   */
  sketches: Feature[] = [];
  lastMeasurementId: number;
  measureVector = new VectorLayer({
    title: 'Measurement sketches',
    source: new Vector(),
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
    HsMapService.loaded().then((m) => {
      this.map = m;
    });
  }

  /**
   * @memberof HsMeasureService
   * @function switchMultipleMode
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
   * @memberof HsMeasureService
   * @function changeMeasureParams
   * @public
   * @param {string} type Geometry type of measurement ('area' for polygon, 'line' for linestring)
   * @description Change geometry type of measurement without deleting of old ones
   */
  changeMeasureParams(type: string): void {
    this.map.removeInteraction(this.draw);
    this.sketches = [];
    this.addInteraction(type);
  }

  /**
   * @memberof HsMeasureService
   * @function clearMeasurement
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
   * @memberof HsMeasureService
   * @function activateMeasuring
   * @public
   * @param type
   * @description Start measuring interaction in app
   */
  activateMeasuring(type: string): void {
    if (!this.map) {
      setTimeout(() => {
        this.activateMeasuring(type);
      }, 500);
      return;
    }
    this.map.addLayer(this.measureVector);
    this.map.getViewport().addEventListener('mousemove', (evt) => {
      this.mouseMoveHandler(evt);
    });
    this.map.getViewport().addEventListener('touchmove', (evt) => {
      this.mouseMoveHandler(evt);
    });
    this.map.getViewport().addEventListener('touchend', (evt) => {
      this.mouseMoveHandler(evt);
    });

    this.addInteraction(type);
  }

  /**
   * @memberof HsMeasureService
   * @function deactivateMeasuring
   * @public
   * @description Stop measuring interaction in app
   */
  deactivateMeasuring(): void {
    this.HsMapService.loaded().then((map) => {
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
    this.HsEventBusService.measurementEnds.next(); //better emit drawingEnds here
  }

  /**
   * @memberof HsMeasureService
   * @function mouseMoveHandler
   * @private
   * @param {object} evt Callback param for mouse move event
   * @description Callback for mouse and touch move event, compute live measurement results
   */
  mouseMoveHandler(evt): void {
    if (this.sketches.length > 0) {
      let output: measurement;

      for (const sketch of this.sketches) {
        const geom = sketch.getGeometry();
        if (this.HsUtilsService.instOf(geom, Polygon)) {
          output = this.addMultiple(this.formatArea(geom), output);
        } else if (this.HsUtilsService.instOf(geom, LineString)) {
          output = this.addMultiple(this.formatLength(geom), output);
        }
      }
      //output.geom = this.sketch;
      setTimeout(() => {
        this.data.measurements[this.lastMeasurementId] = output;
      }, 0);
    }
  }

  /**
   * @memberof HsMeasureService
   * @function addMultiple
   * @private
   * @param {measurement} val1 Output of new object
   * @param {measurement} val2 Old value
   * @returns {measurement}
   * @description Adds two measure results for multiple shape mode to display joined result
   */
  addMultiple(val1: measurement, val2: measurement): measurement {
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
   * @memberof HsMeasureService
   * @function addInteraction
   * @private
   * @param {string} type Geometry type
   * @description Initialize draw interaction on Ol.map and event handlers for handling start and end of drawing
   */
  addInteraction(type: string): void {
    const drawType = type == 'area' ? 'Polygon' : 'LineString';
    this.draw = new Draw({
      source: this.measureVector.getSource(),
      type: /** @type {GeometryType} */ drawType,
      dragVertexDelay: 150,
    });
    this.map.addInteraction(this.draw);

    this.draw.on('drawstart', (evt) => {
      this.HsEventBusService.measurementStarts.next();
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
      this.HsEventBusService.measurementEnds.next();
    });
  }

  /**
   * @memberof HsMeasureService
   * @function formatLength
   * @private
   * @param {LineString} line
   * @returns {measurement} numeric length of line with used units
   * @description Compute and format line length with correct units (m/km)
   */
  formatLength(line: LineString): measurement {
    let length = 0;
    const coordinates = line.getCoordinates();
    const sourceProj = this.HsMapService.getCurrentProj();

    for (let i = 0; i < coordinates.length - 1; ++i) {
      const c1 = transform(coordinates[i], sourceProj, 'EPSG:4326');
      const c2 = transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
      length += getDistance(c1, c2);
    }

    const output = {
      size: length,
      type: 'Length',
      unit: 'm',
    };

    if (length > 100) {
      output.size = Math.round((length / 1000) * 100) / 100;
      output.unit = 'km';
    } else {
      output.size = Math.round(length * 100) / 100;
      output.unit = 'm';
    }
    return output;
  }

  /**
   * @memberof HsMeasureService
   * @function formatArea
   * @private
   * @param {Polygon} polygon
   * @returns {object} area of polygon with used units
   * @description Compute and format polygon area with correct units (m2/km2)
   */
  formatArea(polygon: Polygon): measurement {
    //const sourceProj = this.getCurrentProj();
    const area = Math.abs(getArea(polygon));
    const output = {
      size: area,
      type: 'Area',
      unit: 'm',
    };
    if (area > 10000) {
      output.size = Math.round((area / 1000000) * 100) / 100;
      output.unit = 'km';
    } else {
      output.size = Math.round(area * 100) / 100;
      output.unit = 'm';
    }
    return output;
  }
}

type measurement = {
  size: number;
  type: string;
  unit: string;
};
