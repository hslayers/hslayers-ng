import '../utils';
import * as angular from 'angular';
import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector.component';
import {HsLegendModule} from './legend.module';
import {HsLegendService} from './legend.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedLegendModule = downgrade(HsLegendModule);
/**
 * @namespace hs.legend
 * @memberOf hs
 */
angular
  .module(downgradedLegendModule, ['hs.map', 'hs.utils'])
  .directive(
    'hsLegendLayerDirective',
    downgradeComponent({component: HsLegendLayerComponent})
  )
  .directive(
    'hs.legend.layerVectorDirective',
    downgradeComponent({component: HsLegendLayerVectorComponent})
  )
  .directive(
    'hs.legend.layerStaticDirective',
    downgradeComponent({component: HsLegendLayerStaticComponent})
  )
  .service('HsLegendService', downgradeInjectable(HsLegendService))

  /**
   * @memberof hs.legend
   * @ngdoc component
   * @name hs.legend
   * @description Add legend panel (display available legends for displayed layers) to sidebar
   */
  .directive('hs.legend', downgradeComponent({component: HsLegendComponent}));

angular.module('hs.legend', [downgradedLegendModule]);

export * from './legend.service';
export {HsLegendModule} from './legend.module';
