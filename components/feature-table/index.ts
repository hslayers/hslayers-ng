import * as angular from 'angular';
import {HsFeatureTableComponent} from './feature-table.component';
import {HsFeatureTableModule} from './feature-table.module';
import {HsFeatureTableService} from './feature-table.service';
import {HsLayerFeaturesComponent} from './layer-features.component';
import {downgrade} from './../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsFeatureTableModule);

/**
 * @namespace hs.featureTable * @memberOf hs
 */
angular
  .module(downgradedModule, [])
  .service('hsFeatureTableService', downgradeInjectable(HsFeatureTableService))
  .directive(
    'hsFeatureTable',
    downgradeComponent({component: HsFeatureTableComponent})
  )

  .directive(
    'hsLayerFeatures',
    downgradeComponent({component: HsLayerFeaturesComponent})
  );
angular.module('hs.feature-table', [downgradedModule]);
export {HsFeatureTableModule} from './feature-table.module';
