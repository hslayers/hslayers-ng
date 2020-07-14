import * as GeometryType from 'ol/geom/GeometryType';
import VectorLayer from 'ol/layer/Vector';
import {Draw} from 'ol/interaction';
import {Fill, Stroke, Style} from 'ol/style';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {LineString, Polygon} from 'ol/geom';
import {Vector} from 'ol/source';
import {getArea, getDistance} from 'ol/sphere';
import {transform} from 'ol/proj';

/**
 * @param $rootScope
 * @param HsMapService
 * @param HsUtilsService
 * @param $timeout
 */
@Injectable({
  providedIn: 'root',
})
export class HsMeasureService {
  map;
  draw;
  data = {
    measurements: [],
    multipleShapeMode: false,
  };
  sketch = [];
  currentMeasurement;
  measureVector = new VectorLayer({
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
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService,
    private HsEventBusService: HsEventBusService
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
    this.sketch = null;
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
    this.data.measurements.length = 0;
    this.measureVector.getSource().clear();
    this.sketch = null;
    this.draw.setActive(true);
  }

  /**
   * @memberof HsMeasureService
   * @function activateMeasuring
   * @public
   * @param type
   * @description Start measuring interaction in app
   */
  activateMeasuring(type): void {
    this.map.addLayer(this.measureVector);
    this.map.getViewport().addEventListener('mousemove', this.mouseMoveHandler);
    this.map.getViewport().addEventListener('touchmove', this.mouseMoveHandler);
    this.map.getViewport().addEventListener('touchend', this.mouseMoveHandler);

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
      map.getViewport().removeEventListener('mousemove', this.mouseMoveHandler);
      map.getViewport().removeEventListener('touchmove', this.mouseMoveHandler);
      map.getViewport().removeEventListener('touchend', this.mouseMoveHandler);

      map.removeInteraction(this.draw);
      map.removeLayer(this.measureVector);
    });
  }

  /**
   * @memberof HsMeasureService
   * @function mouseMoveHandler
   * @private
   * @param {object} evt Callback param for mouse move event
   * @description Callback for mouse and touch move event, compute live measurement results
   */
  mouseMoveHandler(evt): void {
    if (this.sketch) {
      let output;

      for (const sketchItem of this.sketch) {
        const geom = sketchItem.getGeometry();
        if (this.HsUtilsService.instOf(geom, Polygon)) {
          output = this.addMultiple(this.formatArea(geom), output);
        } else if (this.HsUtilsService.instOf(geom, LineString)) {
          output = this.addMultiple(this.formatLength(geom), output);
        }
      }

      setTimeout(() => {
        this.data.measurements[this.currentMeasurement] = output;
        if (this.data.measurements[this.currentMeasurement]) {
          this.data.measurements[this.currentMeasurement].geom = this.sketch;
        }
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
   * @description Add two measure results for multiple shape mode to display joined result
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
        if (!Array.isArray(this.sketch)) {
          this.sketch = [];
          this.data.measurements.push({
            size: 0,
            unit: '',
          });
        }
        this.sketch.push(evt.feature);
      } else {
        this.sketch = [evt.feature];
        this.data.measurements.push({
          size: 0,
          unit: '',
        });
      }
      this.currentMeasurement = this.data.measurements.length - 1;
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
    const sourceProj = this.map.getView().getProjection();

    for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
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
    //const sourceProj = this.map.getView().getProjection();
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

interface measurement {
  size: number;
  type: string;
  unit: string;
}
