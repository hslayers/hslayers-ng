import moment from 'moment';
global.moment = moment;
import momentinterval from 'moment-interval/src/moment-interval';

//TODO needs to be documented
export default ['$log', function ($log) {
  const me = this;
  angular.extend(me, {
    prepareTimeSteps(step_string) {
      const step_array = step_string.split(',');
      const steps = [];
      for (let i = 0; i < step_array.length; i++) {
        if (step_array[i].indexOf('/') == -1) {
          steps.push(new Date(step_array[i]).toISOString());
          //console.log(new Date(step_array[i]).toISOString());
        } else {
          //"2016-03-16T12:00:00.000Z/2016-07-16T12:00:00.000Z/P30DT12H"
          const interval_def = step_array[i].split('/');
          let step;
          if (interval_def.length == 3) {
            step = momentinterval.interval(interval_def[2]);
          } else {
            step = momentinterval.interval('P1D');
          }
          const interval = momentinterval.interval(interval_def[0] + '/' + interval_def[1]);
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
        if (moment(dimension.default).isValid()) {
          return me.prepareTimeSteps(dimension.values);
        } else {
          return dimension.values.split(',');
        }
      } catch (ex) {
        $log.error(ex);
      }
    },

    hasNestedLayers(layer) {
      if (angular.isUndefined(layer)) {
        return false;
      }
      return angular.isDefined(layer.Layer);
    },

    paramsFromDimensions(layer) {
      const tmp = {};
      angular.forEach(layer.Dimension, (dimension) => {
        if (dimension.value) {
          tmp[dimension.name] = dimension.value;
        }
      });
      return tmp;
    },

    dimensionType(dimension) {
      if (angular.isUndefined(dimension.type)) {
        return null;
      }
      return dimension.type;
    },

    /**
     * fillDimensionValues
     * @param {ol/Layer} layer Layer to fill the dimension values
     * @description A recursive function with goes through layers
     * children and sets the possible dimension values used in dropdown.
     */
    fillDimensionValues(layer) {
      angular.forEach(layer.Layer, (layer) => {
        if (me.hasNestedLayers(layer)) {
          me.fillDimensionValues(layer);
        }
        angular.forEach(layer.Dimension, (dimension) => {
          dimension.values = me.getDimensionValues(dimension);
        });
      });
    }
  });

  return me;
}];
