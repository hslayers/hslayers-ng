import moment from 'moment';
import { default as vegaEmbed } from 'vega-embed';

export default ['hs.utils.service', '$http', 'config', function (utils, $http, config) {
    var me = this;
    var endpoint = config.senslog;

    return angular.extend(me, {
        units: [],
        sensorsSelected: [],
        sensorIdsSelected: [],
        selectSensor(sensor) {
            me.sensorsSelected = [sensor];
            me.sensorIdsSelected = [sensor.sensor_id]
        },
        /**
         * @memberof hs.sensors.service
         * @function getUnits
         * @description Get list of units from Senslog backend
         */
        getUnits() {
            var url = utils.proxify(`${endpoint.url}/senslogOT/rest/unit`);
            $http.get(url, {
                params: {
                    user_id: endpoint.user_id
                }
            }).then(response => {
                me.units = response.data;
                $http.get(utils.proxify(`${endpoint.url}/MapLogOT/SensorService`), {
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
                var url = utils.proxify(`${endpoint.url}/senslogOT/rest/observation`);
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
                        me.observations.reduce(
                            (acc, val) => acc.concat(
                                val.sensors
                                    .filter(s => me.sensorIdsSelected.indexOf(s.sensor_id) > -1)
                                    .map(s => {
                                        s.sensor_name = sensorDesc.sensor_name;
                                        s.time_stamp =
                                            moment(val.time_stamp)
                                                .format('DD.MM.YYYY HH:mm');
                                        return s
                                    })
                            ), [])
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
                        "type": "nominal"
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