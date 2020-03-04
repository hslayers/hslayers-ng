import VectorLayer from 'ol/layer/Vector';
import {Vector} from 'ol/source';
import {Style, Stroke, Fill} from 'ol/style';
import {Polygon, LineString, GeometryType} from 'ol/geom';
import {Draw} from 'ol/interaction';
import {getArea, getDistance} from 'ol/sphere';
import {transform} from 'ol/proj';

export default ['$rootScope', 'hs.map.service', 'hs.utils.service',
  function ($rootScope, OlMap, utils) {
    const me = this;

    let map;

    OlMap.loaded().then(m => {
      map = m;
    });

    this.draw;

    this.measureVector = new VectorLayer({
      source: new Vector(),
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2
        })
      })
    });

    this.data = {};

    this.data.measurements = [];

    this.data.multipleShapeMode = false;

    this.sketch = {};

    this.currentMeasurement;

    /**
         * @memberof hs.measure.service
         * @function switchMultipleMode
         * @public
         * @param {Boolean} mode Optional parameter if multiple shape mode should be enabled
         * @description Enable/disable multiple shape mode for measuring (switch without parameter)
         */
    this.switchMultipleMode = function (mode) {
      if (angular.isDefined(mode)) {
        me.data.multipleShapeMode = mode;
      } else {
        me.data.multipleShapeMode = !me.data.multipleShapeMode;
      }
    };

    /**
         * @memberof hs.measure.service
         * @function changeMeasureParams
         * @public
         * @param {String} type Geometry type of measurement ('area' for polygon, 'line' for linestring)
         * @description Change geometry type of measurement without deleting of old ones
         */
    this.changeMeasureParams = function (type) {
      map.removeInteraction(me.draw);
      me.sketch = null;
      addInteraction(type);
    };

    /**
         * @memberof hs.measure.service
         * @function clearMeasurement
         * @public
         * @description Clear all measurements and restart measuring
         */
    this.clearMeasurement = function () {
      me.draw.setActive(false);
      me.data.measurements.length = 0;
      me.measureVector.getSource().clear();
      me.sketch = null;
      me.draw.setActive(true);
    };

    /**
         * @memberof hs.measure.service
         * @function activateMeasuring
         * @public
         * @param {Boolean} mode Optional parameter, Geometry type of measurement ('area' for polygon, 'line' for linestring) Line is default
         * @description Start measuring interaction in app
         */
    this.activateMeasuring = function (type) {
      map.addLayer(me.measureVector);
      map.getViewport().addEventListener('mousemove', mouseMoveHandler);
      map.getViewport().addEventListener('touchmove', mouseMoveHandler);
      map.getViewport().addEventListener('touchend', mouseMoveHandler);

      addInteraction(type);
    };

    /**
         * @memberof hs.measure.service
         * @function deactivateMeasuring
         * @public
         * @description Stop measuring interaction in app
         */
    this.deactivateMeasuring = function () {
      map.getViewport().removeEventListener('mousemove', mouseMoveHandler);
      map.getViewport().removeEventListener('touchmove', mouseMoveHandler);
      map.getViewport().removeEventListener('touchend', mouseMoveHandler);

      map.removeInteraction(me.draw);
      map.removeLayer(me.measureVector);
    };

    /**
         * @memberof hs.measure.service
         * @function mouseMoveHandler
         * @private
         * @param {Object} evt Callback param for mouse move event
         * @description Callback for mouse and touch move event, compute live measurement results
         */
    const mouseMoveHandler = function (evt) {
      if (me.sketch) {
        let output;

        for (let i = 0; i < me.sketch.length; i++) {
          const geom = me.sketch[i].getGeometry();
          if (utils.instOf(geom, Polygon)) {
            output = addMultiple(formatArea(geom), output);
          } else if (utils.instOf(geom, LineString)) {
            output = addMultiple(formatLength(geom), output);
          }
        }


        me.data.measurements[me.currentMeasurement] = output;
        if (me.data.measurements[me.currentMeasurement]) {
          me.data.measurements[me.currentMeasurement].geom = me.sketch;
        }
        if (!$rootScope.$$phase) {
          $rootScope.$digest();
        }
      }
    };

    /**
     * @memberof hs.measure.service
     * @function addMultiple
     * @private
     * @param {object} val1 Output of new object
     * @param {object} val2 Old value
     * @description Add two measure results for multiple shape mode to display joined result
     */
    const addMultiple = function (val1, val2) {
      if (val2 == undefined) {
        return val1;
      }
      let unit = val1.unit;
      const type = val1.type;
      if (val1.unit == val2.unit) {
        var value = Math.round((val1.size + val2.size) * 100) / 100;
        if (unit == 'm' && type == 'length' && value > 1000) {
          value = Math.round(value / 1000 * 100) / 100;
          unit = 'km';
        } else if (unit == 'm' && type == 'area' && value > 10000) {
          value = Math.round(value / 1000000 * 100) / 100;
          unit = 'km';
        }
      } else {
        const arr = [val1, val2];
        for (let i = 0; i < arr.length; i++) {
          if (arr[i].unit == 'm') {
            type == 'length' ? arr[i].size /= 1000 : arr[i].size /= 1000000;
          }
        }
        var value = Math.round((arr[0].size + arr[1].size) * 100) / 100;
        unit = 'km';
      }
      const output = {
        size: value,
        type: type,
        unit: unit
      };
      return output;
    };

    /**
         * @memberof hs.measure.service
         * @function addInteraction
         * @private
         * @param {Boolean} type Geometry type
         * @description Initialize draw interaction on Ol.map and event handlers for handling start and end of drawing
         */
    function addInteraction(type) {
      const drawType = (type == 'area' ? 'Polygon' : 'LineString');
      me.draw = new Draw({
        source: me.measureVector.getSource(),
        type: /** @type {GeometryType} */ (drawType),
        dragVertexDelay: 150
      });
      map.addInteraction(me.draw);

      me.draw.on('drawstart',
        (evt) => {
          $rootScope.$broadcast('measure.drawStart');
          if (me.data.multipleShapeMode) {
            if (!angular.isArray(me.sketch)) {
              me.sketch = [];
              me.data.measurements.push({
                size: 0,
                unit: ''
              });
            }
            me.sketch.push(evt.feature);
          } else {
            me.sketch = [evt.feature];
            me.data.measurements.push({
              size: 0,
              unit: ''
            });
          }
          me.currentMeasurement = me.data.measurements.length - 1;
        });

      me.draw.on('drawend',
        (evt) => {
          $rootScope.$broadcast('measure.drawEnd');
        });
    }

    /**
         * @memberof hs.measure.service
         * @function formatLength
         * @private
         * @param {ol.geom.LineString} line
         * @return {object} numeric length of line with used units
         * @description Compute and format line length with correct units (m/km)
         */
    const formatLength = function (line) {
      let length = 0;
      const coordinates = line.getCoordinates();
      const sourceProj = map.getView().getProjection();


      for (let i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        const c1 = transform(coordinates[i], sourceProj, 'EPSG:4326');
        const c2 = transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
        length += getDistance(c1, c2);
      }

      const output = {
        size: length,
        type: 'length',
        unit: 'm'
      };

      if (length > 100) {
        output.size = (Math.round(length / 1000 * 100) / 100);
        output.unit = 'km';
      } else {
        output.size = (Math.round(length * 100) / 100);
        output.unit = 'm';
      }
      return output;
    };

    /**
         * @memberof hs.measure.service
         * @function formatArea
         * @private
         * @param {ol.geom.Polygon} polygon
         * @return {object} area of polygon with used units
         * @description Compute and format polygon area with correct units (m2/km2)
         */
    const formatArea = function (polygon) {
      const sourceProj = map.getView().getProjection();
      const area = Math.abs(getArea(polygon));
      const output = {
        size: area,
        type: 'area',
        unit: 'm'
      };
      if (area > 10000) {
        output.size = (Math.round(area / 1000000 * 100) / 100);
        output.unit = 'km';
      } else {
        output.size = (Math.round(area * 100) / 100);
        output.unit = 'm';
      }
      return output;
    };
  }
];
