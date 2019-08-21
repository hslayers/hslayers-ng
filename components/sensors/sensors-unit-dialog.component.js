import { default as vegaEmbed } from 'vega-embed';
import moment from 'moment';

export default {
    template: require('./partials/unit-dialog.html'),
    bindings: {
        unit: '='
    },
    controller: ['$scope', 'hs.map.service', 'hs.sensors.service', 'hs.layout.service', function ($scope, OlMap, sensorsService, layoutService) {
        var map;
        sensorsService.unitDialogVisible = true;
        angular.extend($scope, {
            layoutService,
            sensorsService,

            /**
             * @memberof hs.sensors.unitDialog
             * @function sensorClicked
             * @description Regenerate chart for sensor is clicked. If no 
             * interval was clicked before use 1 day timeframe by default.
             */
            sensorClicked(sensor) {
                $scope.sensorSelected = sensor;
                $scope.sensorIdSelected = sensor.sensor_id;
                if (angular.isUndefined($scope.currentInterval)) {
                    $scope.timeButtonClicked({ amount: 1, unit: 'days' })
                } else
                    $scope.createChart()
            },

            /**
             * @memberof hs.sensors.unitDialog
             * @function timeButtonClicked
             * @description Get data for different time interval and regenerate 
             * chart
             */
            timeButtonClicked(interval) {
                $scope.currentInterval = interval;
                sensorsService.getObservationHistory(
                    $scope.$ctrl.unit,
                    interval
                ).then($scope.createChart)
            },

            /**
             * @memberof hs.sensors.unitDialog
             * @function createChart
             * @description Create vega chart definition and use it in vegaEmbed 
             * chart library. Observations for a specific unit from Senslog come 
             * in a hierarchy, where 1st level contains object with timestamp and 
             * for each timestamp there exist multiple sensor observations for 
             * varying count of sensors. This nested list is flatened to simple 
             * array of objects with {sensor_id, timestamp, value, sensor_name}
             */
            createChart() {
                var sensorDesc = $scope.$ctrl.unit.sensors.filter(s =>
                    s.sensor_id == $scope.sensorIdSelected
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
                            sensorsService.observations.reduce(
                                (acc, val) => acc.concat(
                                    val.sensors
                                        .filter(s => s.sensor_id == $scope.sensorIdSelected)
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
        });

        function init() {
            map = OlMap.map;
        }

        OlMap.loaded().then(init);
    }]
}