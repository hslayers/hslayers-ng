import moment from 'moment';
global.moment = moment;

export default ['$rootScope', 'hs.map.service', 'Core', 'hs.utils.service', 'config',
    function ($rootScope, OlMap, Core, utils, config) {
        var me = {};

        /**
         * Get date format of time data based on time unit property
         * @function getDateFormatForTimeSlider
         * @memberOf hs.layermanager.WMSTservice
         * @param {String} time_unit
         */
        me.getDateFormatForTimeSlider = function (time_unit) {
            switch (time_unit) {
                case 'FullYear':
                case 'Month':
                case 'Day':
                    return date_format = 'dd-MM-yyyy';;
                    break
                default:
                    return 'dd-MM-yyyy HH:mm';;
            }
        }

        /**
         * Set time intervals for WMS-T (WMS with time support)
         * @function setLayerTimeSliderIntervals
         * @memberOf hs.layermanager.WMSTservice
         * @param {Object} new_layer Layer to set time intervals
         * @param {Object} metadata Time dimension metadata for layer
         */
        me.setLayerTimeSliderIntervals = function (new_layer, metadata) {
            switch (new_layer.time_unit) {
                case 'FullYear':
                    var d = new Date(metadata.timeInterval[0]);
                    new_layer.min_time = d.getFullYear();
                    d = new Date(metadata.timeInterval[1]);
                    new_layer.max_time = d.getFullYear();
                    break;
                case 'Month':
                    var d = new Date(metadata.timeInterval[0]);
                    new_layer.min_time = 0;
                    var d2 = new Date(metadata.timeInterval[1]);
                    new_layer.max_time = d.monthDiff(d2);
                    break;
                default:
                    new_layer.min_time = moment.utc(metadata.timeInterval[0]).toDate().getTime();
                    new_layer.max_time = moment.utc(metadata.timeInterval[1]).toDate().getTime();
            }
        }

        /**
         * @function parseInterval
         * @memberOf hs.layermanager.WMSTservice
         * @param {String} interval Interval time string
         * @description Parse interval string to get interval in Date format
         */
        function parseInterval(interval) {
            var dateComponent;
            var timeComponent;

            var year;
            var month;
            var day;
            var week;
            var hour;
            var minute;
            var second;

            year = month = week = day = hour = minute = second = 0;

            var indexOfT = interval.search("T");

            if (indexOfT > -1) {
                dateComponent = interval.substring(1, indexOfT);
                timeComponent = interval.substring(indexOfT + 1);
            } else {
                dateComponent = interval.substring(1);
            }

            // parse date
            if (dateComponent) {
                var indexOfY = (dateComponent.search("Y") > -1 ? dateComponent.search("Y") : undefined);
                var indexOfM = (dateComponent.search("M") > -1 ? dateComponent.search("M") : undefined);
                var indexOfW = (dateComponent.search("W") > -1 ? dateComponent.search("W") : undefined);
                var indexOfD = (dateComponent.search("D") > -1 ? dateComponent.search("D") : undefined);

                if (indexOfY !== undefined) {
                    year = parseFloat(dateComponent.substring(0, indexOfY));
                }
                if (indexOfM !== undefined) {
                    month = parseFloat(dateComponent.substring((indexOfY || -1) + 1, indexOfM));
                }
                if (indexOfD !== undefined) {
                    day = parseFloat(dateComponent.substring((indexOfM || indexOfY || -1) + 1, indexOfD));
                }
            }

            // parse time
            if (timeComponent) {
                var indexOfH = (timeComponent.search("H") > -1 ? timeComponent.search("H") : undefined);
                var indexOfm = (timeComponent.search("M") > -1 ? timeComponent.search("M") : undefined);
                var indexOfS = (timeComponent.search("S") > -1 ? timeComponent.search("S") : undefined);

                if (indexOfH !== undefined) {
                    hour = parseFloat(timeComponent.substring(0, indexOfH));
                }
                if (indexOfm !== undefined) {
                    minute = parseFloat(timeComponent.substring((indexOfH || -1) + 1, indexOfm));
                }
                if (indexOfS !== undefined) {
                    second = parseFloat(timeComponent.substring((indexOfm || indexOfH || -1) + 1, indexOfS));
                }
            }
            // year, month, day, hours, minutes, seconds, milliseconds)
            var zero = new Date(0, 0, 0, 0, 0, 0, 0);
            var step = new Date(year, month, day, hour, minute, second, 0);
            return step - zero;
        }
        /**
         * @function layerIsWmsT
         * @memberOf hs.layermanager.WMSTservice
         * @param {Ol.collection} layer_container Container object of layer (layer_container.layer expected)
         * @return {Boolean} True for WMS layer with time support
         * Test if WMS layer have time support (WMS-T). WMS layer has to have dimensions_time or dimension property, function converts dimension to dimensions_time
         */
        me.layerIsWmsT = function (layer_container) {
            if (angular.isUndefined(layer_container) || layer_container == null) return false;
            var layer = layer_container.layer;
            if (angular.isUndefined(layer)) return false;
            if (layer.get('dimensions_time') && angular.isArray(layer.get('dimensions_time').timeInterval)) return true;
            if (layer.get('dimensions') && angular.isObject(layer.get('dimensions').time)) {
                var metadata = {};
                var value = layer.get('dimensions').time.values;
                if (angular.isArray(value)) value = value[0];
                if (typeof value === 'string' || utils.instOf(value, String)) {
                    value = value.replace(/\s*/g, "");

                    if (value.search("/") > -1) {
                        var interval = value.split("/").map(function (d) {
                            if (d.search("Z") > -1) {
                                d = d.replace("Z", "00:00");
                            }
                            return d;
                        });

                        if (interval.length == 3) {
                            metadata.timeStep = parseInterval(interval[2]);
                            interval.pop();
                        }
                        if (interval.length == 2)
                            metadata.timeInterval = interval;
                    }
                    angular.extend(layer, {
                        dimensions_time: metadata
                    })
                }

                return Object.keys(metadata).length > 0;
            }
            return false;
        }

        /**
         * @function setLayerTime
         * @memberOf hs.layermanager.WMSTservice
         * @param {object} currentLayer Selected layer 
         * @param {number} dateIncrement Value days, months or years by which to increment start time to reach current selected time in the range control 
         * @description Update layer time parameter
         */
        me.setLayerTime = function (currentLayer, dateIncrement) {
            if (angular.isUndefined(currentLayer) || angular.isUndefined(currentLayer.layer)) return;
            var dimensions_time = currentLayer.layer.get('dimensions_time') || currentLayer.layer.dimensions_time;
            if (angular.isUndefined(dimensions_time)) return;
            var d = moment.utc(dimensions_time.timeInterval[0]);
            switch (currentLayer.time_unit) {
                case "FullYear":
                    d.setFullYear(dateIncrement);
                    break;
                case "Month":
                    d.addMonths(dateIncrement);
                    break;
                default:
                    if (dateIncrement < currentLayer.min_time) {
                        dateIncrement = currentLayer.min_time;
                    }
                    if (dateIncrement > currentLayer.max_time) {
                        dateIncrement = currentLayer.max_time;
                    }
                    d = moment.utc(parseInt(dateIncrement));
            }

            currentLayer.time = d.toDate();
            currentLayer.layer.getSource().updateParams({
                'TIME': d.toISOString()
            });
            $rootScope.$broadcast('layermanager.layer_time_changed', currentLayer.layer, d.toISOString());
        }

        me.setupTimeLayerIfNeeded = function(new_layer){
            if (me.layerIsWmsT(new_layer)) {
                var dimensions_time = new_layer.layer.get('dimensions_time') || new_layer.layer.dimensions_time;
                var time;
                if (angular.isDefined(new_layer.layer.get('dimensions').time.default)) {
                    time = new Date(new_layer.layer.get('dimensions').time.default);
                } else {
                    time = new Date(dimensions_time.timeInterval[0]);
                }
                angular.extend(new_layer, {
                    time_step: dimensions_time.timeStep,
                    time_unit: dimensions_time.timeUnit,
                    date_format: me.getDateFormatForTimeSlider(dimensions_time.timeUnit),
                    date_from: new Date(dimensions_time.timeInterval[0]),
                    date_till: new Date(dimensions_time.timeInterval[1]),
                    time: time,
                    date_increment: time.getTime()
                });
                me.setLayerTimeSliderIntervals(new_layer, dimensions_time);
                me.setLayerTime(new_layer);
            }
        }

        return me;
    }
]