import '../utils/utils.module';
import legendComponent from './legend.component';
import legendLayerDirective from './legend-layer.directive';
import legendLayerStaticDirective from './legend-layer-static.directive';
import legendLayerVectorDirective from './legend-layer-vector.directive';
import legendService from './legend.service';

/**
 * @namespace hs.legend
 * @memberOf hs
 */
angular
  .module('hs.legend', ['hs.map', 'hs.utils'])
  .directive('hs.legend.layerDirective', legendLayerDirective)
  .directive('hs.legend.layerVectorDirective', legendLayerVectorDirective)
  .directive('hs.legend.layerStaticDirective', legendLayerStaticDirective)
  .factory('HsLegendService', legendService)

  /**
   * @memberof hs.legend
   * @ngdoc component
   * @name hs.legend
   * @description Add legend panel (display available legends for displayed layers) to sidebar
   */
  .component('hs.legend', legendComponent);
