import moment from 'moment';
global.moment = moment;
import momentinterval from 'moment-interval/src/moment-interval';

//TODO needs to be documented
export default [function () {
    var me = this;
    angular.extend(me, {
        prepareTimeSteps(step_string) {
            var step_array = step_string.split(',');
            var steps = [];
            for (var i = 0; i < step_array.length; i++) {
                if (step_array[i].indexOf('/') == -1) {
                    steps.push(new Date(step_array[i]).toISOString());
                    //console.log(new Date(step_array[i]).toISOString());
                } else {
                    //"2016-03-16T12:00:00.000Z/2016-07-16T12:00:00.000Z/P30DT12H"
                    var interval_def = step_array[i].split('/');
                    var step;
                    if(interval_def.length==3) 
                        step = momentinterval.interval(interval_def[2]);
                    else {
                        step = momentinterval.interval('P1D');
                    }
                    var interval = momentinterval.interval(interval_def[0] + '/' + interval_def[1]);
                    while (interval.start() < interval.end()) {
                        //console.log(interval.start().toDate().toISOString());
                        steps.push(interval.start().toDate().toISOString());
                        interval.start(momentinterval.utc(interval.start().toDate()).add(step.period()));
                    }
                }
            }
            return steps;
        },

        getDimensionValues(dimension) {
            try {
                if (moment(dimension.default).isValid())
                    return me.prepareTimeSteps(dimension.values)
                else
                    return dimension.values.split(',');
            } catch (ex) {
                console.error(ex)
            }
        },

        hasNestedLayers(layer) {
            if (angular.isUndefined(layer)) return false;
            return angular.isDefined(layer.Layer);
        },

        paramsFromDimensions(layer) {
            var tmp = {};
            angular.forEach(layer.Dimension, function (dimension) {
                if (dimension.value)
                    tmp[dimension.name] = dimension.value;
            });
            return tmp;
        },

        fillDimensionValues(layer) {
            angular.forEach(layer.Layer, function (layer) {
                if (me.hasNestedLayers(layer)) {
                    me.fillDimensionValues(layer);
                }
                angular.forEach(layer.Dimension, function (dimension) {
                    dimension.values = me.getDimensionValues(dimension);
                })
            })
        }
    })

    return me;
}]