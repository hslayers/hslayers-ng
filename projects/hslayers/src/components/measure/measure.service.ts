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
   * sketches Array of measure sketches
   */
  sketches: Feature<Geometry>[] = [];
  lastMeasurementId: number;
  measureVector: VectorLayer<VectorSource<Geometry>>;
  measuringActivated = false;
  constructor(
    public hsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
  ) {
    this.setMeasureLayer();
    setTitle(this.measureVector, 'Measurement sketches');
  }

  /**
   * Enable/disable multiple shape mode for measuring (switch without parameter)
   * @public
   * @param mode - Optional parameter if multiple shape mode should be enabled
   */
  switchMultipleMode(mode?: boolean): void {
    if (mode !== undefined) {
      this.data.multipleShapeMode = mode;
    } else {
      this.data.multipleShapeMode = !this.data.multipleShapeMode;
    }
  }

  /**
   * Set new measure vector layer
   */
  setMeasureLayer(): void {
    this.measureVector = new VectorLayer({
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
   * Change geometry type of measurement without deleting of old ones
   * @public
   * @param type - Geometry type of measurement ('area' for polygon, 'line' for linestring)
   */
  changeMeasureParams(type: string): void {
    this.hsMapService.getMap().removeInteraction(this.draw);
    this.sketches = [];
    this.addInteraction(type);
  }

  /**
   * Clear all measurements and restart measuring
   * @public
   */
  clearMeasurement(): void {
    this.draw.setActive(false);
    this.data.measurements = [];
    this.measureVector.getSource().clear();
    this.sketches = [];
    this.draw.setActive(true);
  }

  /**
   * Start measuring interaction in app
   * @public
   */
  activateMeasuring(type: string): void {
    if (this.measuringActivated) {
      return;
    }
    const map = this.hsMapService.getMap();
    if (!map) {
      setTimeout(() => {
        this.activateMeasuring(type);
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

    this.addInteraction(type);
    this.measuringActivated = true;
  }

  /**
   * Stop measuring interaction in app
   * @public
   */
  deactivateMeasuring(): void {
    this.hsMapService.loaded().then((map) => {
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
    this.measuringActivated = false;
    this.HsEventBusService.measurementEnds.next(); //better emit drawingEnds here
  }

  /**
   * Callback for mouse and touch move event, compute live measurement results
   * @param evt - Callback param for mouse move event
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
              this.hsMapService.getCurrentProj(),
            ),
            output,
          );
        } else if (this.HsUtilsService.instOf(geom, LineString)) {
          output = this.addMultiple(
            this.HsUtilsService.formatLength(
              geom as LineString,
              this.hsMapService.getCurrentProj(),
            ),
            output,
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
   * Adds two measure results for multiple shape mode to display joined result
   * @param val1 - Output of new object
   * @param val2 - Old value
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
   * Initialize draw interaction on Ol.map and event handlers for handling start and end of drawing
   * @param type - Geometry type
   */
  addInteraction(type: string): void {
    const drawType = type == 'area' ? 'Polygon' : 'LineString';
    this.draw = new Draw({
      source: this.measureVector.getSource(),
      type: drawType,
      dragVertexDelay: 150,
    });
    this.hsMapService.getMap().addInteraction(this.draw);

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
}
