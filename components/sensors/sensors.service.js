import moment from 'moment';
import { default as vegaEmbed } from 'vega-embed';
import { WKT } from 'ol/format';
import VectorLayer from 'ol/layer/Vector';
import { Vector as VectorSource } from 'ol/source';
import { Style, Icon, Stroke, Fill, Circle, Text } from 'ol/style';

var labelStyle = new Style({
    geometry: function (feature) {
        var geometry = feature.getGeometry();
        if (geometry.getType() == 'MultiPolygon') {
            // Only render label for the widest polygon of a multipolygon
            var polygons = geometry.getPolygons();
            var widest = 0;
            for (var i = 0, ii = polygons.length; i < ii; ++i) {
                var polygon = polygons[i];
                var width = getWidth(polygon.getExtent());
                if (width > widest) {
                    widest = width;
                    geometry = polygon;
                }
            }
        }
        return geometry;
    },
    text: new Text({
        font: '12px Calibri,sans-serif',
        overflow: true,
        fill: new Fill({
            color: '#000'
        }),
        stroke: new Stroke({
            color: '#fff',
            width: 3
        })
    })
});

var bookmarkStyle = [new Style({
    fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new Stroke({
        color: '#e49905',
        width: 2
    }),
    image: new Icon({
        src: require('../../components/styles/img/svg/wifi8.svg'),
        crossOrigin: 'anonymous',
        anchor: [0.5, 1]
    })
}), labelStyle];

export default ['hs.utils.service', '$http', 'config', 'hs.map.service', 'hs.layout.service', '$rootScope', '$compile', '$timeout', function (utils, $http, config, hsMap, layoutService, $rootScope, $compile, $timeout) {
    var me = this;
    var endpoint = config.senslog;

    $rootScope.$on('vectorQuery.featureSelected', utils.debounce((event, feature) => {
        if (feature.getLayer(hsMap.map) == me.layer) {
            layoutService.setMainPanel('sensors');
            me.units.forEach(unit => unit.expanded = false);
            me.selectUnit(me.units.filter(unit =>
                unit.unit_id == feature.get('unit_id')
            )[0]);
        }
    }))

    return angular.extend(me, {
        units: [],
        sensorsSelected: [],
        sensorIdsSelected: [],
        layers: null,
        selectSensor(sensor) {
            me.sensorsSelected = [sensor];
            me.sensorIdsSelected = [sensor.sensor_id]
        },
        selectUnit(unit) {
            me.unit = unit;
            unit.expanded = !unit.expanded;
            me.selectSensor(unit.sensors[0]);
            if (document.querySelector('#sensor-unit-dialog') == null) {
                const dir = 'hs.sensors.unit-dialog';
                const html = `<${dir} unit="sensorsService.unit"></${dir}>`;
                const element = angular.element(html)[0];
                document.querySelector(".gui-overlay").appendChild(element);
                $compile(element)($rootScope.$new());
            } else {
                me.unitDialogVisible = true;
            }
            $timeout(_ => {
                if (angular.isUndefined(me.currentInterval))
                    me.currentInterval = { amount: 1, unit: 'days' };
                me.getObservationHistory(
                    me.unit,
                    me.currentInterval
                ).then(_ => me.createChart(me.unit))

            }, 0)
        },
        createLayer() {
            me.layer = new VectorLayer({
                title: 'Sensor units',
                synchronize: true,
                editor: {
                    editable: false
                },
                style: function (feature) {
                    labelStyle.getText().setText(feature.get('name'));
                    return bookmarkStyle;
                },
                source: new VectorSource({})
            });
            hsMap.map.addLayer(me.layer)
        },
        /**
         * @memberof hs.sensors.service
         * @function getUnits
         * @description Get list of units from Senslog backend
         */
        getUnits() {
            if (me.layer == null) me.createLayer();
            var url = utils.proxify(`${endpoint.url}/senslog-lite/rest/unit`);
            $http.get(url, {
                params: {
                    user_id: endpoint.user_id
                }
            }).then(response => {
                me.units = response.data;
                let features = me.units
                    .filter(unit => unit.unit_position && unit.unit_position.asWKT)
                    .map(unit => {
                        const format = new WKT();
                        const feature = format.readFeature(unit.unit_position.asWKT, {
                            dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'
                        })
                        feature.set('name', unit.description);
                        feature.set('unit_id', unit.unit_id);
                        return feature
                    })
                me.layer.getSource().addFeatures(features);

                $http.get(utils.proxify(`${endpoint.url}/senslog1/SensorService`), {
                    params: {
                        Operation: 'GetLastObservations',
                        group: endpoint.group,
                        user: endpoint.user
                    }
                }).then(response => {
                    var sensorValues = {};
                    response.data.forEach(sv => {
                        sensorValues[sv.sensorId] = sv.observedValue;
                    });
                    me.units.forEach(unit => {
                        unit.sensors.forEach(sensor => {
                            sensor.lastObservationValue = sensorValues[sensor.sensor_id];
                        })
                    })
                })
            },
                function (err) {

                });
        },

        /**
         * @memberof hs.sensors.service
         * @function getObservationHistory
         * @param {Object} unit Object containing 
         * {description, is_mobile, sensors, unit_id, unit_type}
         * @param {Object} interval Object {amount, unit}. Used to substract time
         * from current time, like 6 months before now
         * @description Gets list of observations in a given time frame for all 
         * the sensors on a sensor unit (meteostation). 
         */
        getObservationHistory(unit, interval) {
            return new Promise((resolve, reject) => {
                var url = utils.proxify(`${endpoint.url}/senslog-lite/rest/observation`);
                var from_time = moment().subtract(interval.amount, interval.unit);
                from_time = `${from_time.format('YYYY-MM-DD')} ${from_time.format('HH:mm:ssZ')}`;
                $http.get(url, {
                    params: {
                        user_id: endpoint.user_id,
                        unit_id: unit.unit_id,
                        from_time
                    }
                }).then(
                    response => {
                        me.observations = response.data;
                        resolve()
                    },
                    function (err) {
                        reject(err)
                    }).catch((e) => { reject(e) });
            }
            )
        },

        /**
         * @memberof hs.sensors.service
         * @function createChart
         * @description Create vega chart definition and use it in vegaEmbed 
         * chart library. Observations for a specific unit from Senslog come 
         * in a hierarchy, where 1st level contains object with timestamp and 
         * for each timestamp there exist multiple sensor observations for 
         * varying count of sensors. This nested list is flatened to simple 
         * array of objects with {sensor_id, timestamp, value, sensor_name}
         */
        createChart(unit) {
            var sensorDesc = unit.sensors.filter(s =>
                me.sensorIdsSelected.indexOf(s.sensor_id) > -1
            );
            if (sensorDesc.length > 0) sensorDesc = sensorDesc[0];
            let observations = me.observations.reduce(
                (acc, val) => acc.concat(
                    val.sensors
                        .filter(s => me.sensorIdsSelected.indexOf(s.sensor_id) > -1)
                        .map(s => {
                            var time = moment(val.time_stamp);
                            s.sensor_name = sensorDesc.sensor_name;
                            s.time = time.format('DD.MM.YYYY HH:mm');
                            s.time_stamp = time.toDate();
                            return s
                        })
                ), []);
            observations.sort((a, b) => {
                if (a.time_stamp > b.time_stamp) return 1;
                if (b.time_stamp > a.time_stamp) return -1;
                return 0;
            });
            //See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat for flattening array
            var chartData = {
                "$schema": "https://vega.github.io/schema/vega-lite/v3.4.0.json",
                "config": {
                    "mark": {
                        "tooltip": null
                    },
                },
                "width": document.querySelector('#chartplace').offsetWidth - 40,
                "autosize": {
                    "type": "fit",
                    "contains": "padding"
                },
                "data": {
                    "name": "data-062c25e80e0ff23df3803082d5c6f7e7"
                },
                "datasets": {
                    "data-062c25e80e0ff23df3803082d5c6f7e7":
                        observations
                },
                "encoding": {
                    "color": {
                        "field": "sensor_name",
                        "legend": {
                            "title": `Sensor`
                        },
                        "type": "nominal"
                    },
                    "x": {
                        "axis": {
                            "title": "Timestamp",
                            "labelOverlap": true
                        },
                        "field": "time_stamp",
                        "sort": false,
                        "type": "temporal"
                    },
                    "y": {
                        "axis": {
                            "title": `${sensorDesc.phenomenon_name} ${sensorDesc.uom}`
                        },
                        "field": "value",
                        "type": "quantitative"
                    }
                },
                "mark": { "type": "line", "tooltip": { "content": "data" } },
                "selection": {
                    "selector016": {
                        "bind": "scales",
                        "encodings": [
                            "x",
                            "y"
                        ],
                        "type": "interval"
                    }
                }
            }
            try {
                vegaEmbed(document.querySelector('#chartplace'), chartData);
            } catch (ex) {
                console.warn('Could not create vega chart:', ex);
            }
        }

    })
}]