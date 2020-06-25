import { downgradeInjectable, downgradeComponent } from '@angular/upgrade/static';
import { HsLegendModule } from './legend.module';
import * as angular from "angular";
import { downgrade } from '../../common/downgrader';
import { HsLegendService } from './legend.service';
import { HsLegendComponent } from './legend.component';
import '../utils/utils.module';
import {HsLegendLayerComponent} from './legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector.component';

export const downgradedLegendModule = downgrade(HsLegendModule);
/**
 * @namespace hs.legend
 * @memberOf hs
 */
angular
  .module(downgradedLegendModule, ['hs.map', 'hs.utils'])
  .directive('hsLegendLayerDirective', downgradeComponent({ component: HsLegendLayerComponent }))
  .directive('hs.legend.layerVectorDirective', downgradeComponent({ component: HsLegendLayerVectorComponent }))
  .directive('hs.legend.layerStaticDirective', downgradeComponent({ component: HsLegendLayerStaticComponent }))
  .service('HsLegendService', downgradeInjectable(HsLegendService))

  /**
   * @memberof hs.legend
   * @ngdoc component
   * @name hs.legend
   * @description Add legend panel (display available legends for displayed layers) to sidebar
   */
  .directive('hs.legend', downgradeComponent({ component: HsLegendComponent }));

angular
  .module('hs.legend', [downgradedLegendModule]);

export * from './legend.service';
export { HsLegendModule } from './legend.module';
