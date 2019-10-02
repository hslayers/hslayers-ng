import 'components/utils/utils.module';
import legendService from './legend.service';
import legendLayerDirective from './legend-layer.directive';
import legendLayerVectorDirective from './legend-layer-vector.directive';
import legendComponent from './legend.component';

/**
 * @namespace hs.legend
 * @memberOf hs
 */

var module = angular.module('hs.legend', ['hs.map', 'hs.utils']);

module.directive('hs.legend.layerDirective', legendLayerDirective);
module.directive('hs.legend.layerVectorDirective', legendLayerVectorDirective);

module.service('hs.legend.service', legendService);

/**
 * @memberof hs.legend
 * @ngdoc component
 * @name hs.legend
 * @description Add legend panel (display available legends for displayed layers) to sidebar
 */
module.component('hs.legend', legendComponent);
