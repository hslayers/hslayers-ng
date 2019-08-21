import moment from 'moment';

export default ['hs.utils.service', '$http', 'config', function (utils, $http, config) {
    var me = this;
    var endpoint = config.senslogOT;

    return angular.extend(me, {
        units: [],

        /**
         * @memberof hs.sensors.service
         * @function getUnits
         * @description Get list of units from Senslog backend
         */
        getUnits() {
            var url = utils.proxify(`${endpoint.url}/rest/unit`);
            $http.get(url, {
                params: {
                    user_id: endpoint.user_id
                }
            }).then(
                response => {
                    me.units = response.data;
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
                var url = utils.proxify(`${endpoint.url}/rest/observation`);
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
        }
    })
}]