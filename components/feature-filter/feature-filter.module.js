import 'components/map/map.module';
import 'components/layermanager/layermanager.module';
import featureFilterElementDirective from './feature-filter-element.directive';
import featureFilterService from './feature-filter.service';
import featureFilterController from './feature-filter.controller';
import featureListController from './feature-list.controller';
import featureListDirective from './feature-list.directive';
import featureFilterDirective from './feature-filter.directive';

/**
* @namespace hs.featureFilter
* @memberOf hs  
* @desc Module is used to filter certain features on vector layers based on attribute values.
* It also draws nice charts with bars proportionaly to usage of each value of a particular attribute.
* 
* must provide layers to be fillterable in app.js parametrs:         
*      module.value('crossfilterable_layers', [{
    layer_ix: 1,
    attributes: ["http://gis.zcu.cz/poi#category_osm"]
}]); 
*/
var module = angular.module('hs.featureFilter', ['hs.map', 'hs.core', 'hs.layermanager']);

/**
* @memberof hs.featureFilter
* @ngdoc directive
* @name hs.featureFilter.directive
* @description TODO
*/
module.directive('hs.featureFilter.directive', featureFilterDirective);

/**
* @memberof hs.feature_list
* @ngdoc directive
* @name hs.featureList.directive
* @description TODO
*/
module.directive('hs.featureList.directive', featureListDirective);

/**
* @memberof hs.featureFilter
* @ngdoc directive
* @name hs.featureFilter.element.directive
* @description TODO
*/
module.directive('hs.featureFilter.element.directive', featureFilterElementDirective);

/**
* @memberof hs.featureFilter
* @ngdoc service
* @name hs.featureFilter.service
* @description TODO
*/
module.service('hs.featureFilter.service', featureFilterService);

/**
* @memberof hs.featureFilter
* @ngdoc controller
* @name hs.featureFilter.controller
* @description TODO
*/
module.controller('hs.featureFilter.controller', featureFilterController);

/**
* @memberof hs.featureFilter
* @ngdoc controller
* @name hs.featureList.controller
* @description TODO
*/
module.controller('hs.feature_list.controller', featureListController);

