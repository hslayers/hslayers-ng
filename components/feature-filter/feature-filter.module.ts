import '../layermanager/';
import * as angular from 'angular';
import featureFilterController from './feature-filter.controller';
import featureFilterDirective from './feature-filter.directive';
import featureFilterElementDirective from './feature-filter-element.directive';
import featureFilterService from './feature-filter.service';
import featureListController from './feature-list.controller';
import featureListDirective from './feature-list.directive';

/**
 * @namespace hs.featureFilter
 * @memberOf hs
 * @description Module is used to filter certain features on vector layers based on attribute values.
 * It also draws nice charts with bars proportionaly to usage of each value of a particular attribute.
 *
 * must provide layers to be fillterable in app.js parametrs:
 *      module.value('crossfilterable_layers', [{
    layer_ix: 1,
    attributes: ["http://gis.zcu.cz/poi#category_osm"]
}]);
 */
angular
  .module('hs.featureFilter', ['hs.core', 'hs.layermanager'])

  /**
   * @memberof hs.featureFilter
   * @ngdoc directive
   * @name hs.featureFilter.directive
   * @description TODO
   */
  .directive('hs.featureFilter.directive', featureFilterDirective)

  /**
   * @memberof hs.feature_list
   * @ngdoc directive
   * @name hs.featureList.directive
   * @description TODO
   */
  .directive('hs.featureList.directive', featureListDirective)

  /**
   * @memberof hs.featureFilter
   * @ngdoc directive
   * @name hs.featureFilter.element.directive
   * @description TODO
   */
  .directive(
    'hs.featureFilter.element.directive',
    featureFilterElementDirective
  )

  /**
   * @memberof hs.featureFilter
   * @ngdoc service
   * @name HsFeatureFilterService
   * @description TODO
   */
  .factory('HsFeatureFilterService', featureFilterService)

  /**
   * @memberof hs.featureFilter
   * @ngdoc controller
   * @name HsFeatureFilterController
   * @description TODO
   */
  .controller('HsFeatureFilterController', featureFilterController)

  /**
   * @memberof hs.featureFilter
   * @ngdoc controller
   * @name hs.featureList.controller
   * @description TODO
   */
  .controller('HsFeatureListController', featureListController);
