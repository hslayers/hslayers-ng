import * as angular from 'angular';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

import {HsMapComponent} from './map.component';
import {HsMapModule} from './map.module';
import {HsMapService} from './map.service';

export const downgradedMapModule = downgrade(HsMapModule);

angular
  .module(downgradedMapModule, ['hs.language'])
  .service('HsMapService', downgradeInjectable(HsMapService))
  .directive('hs.map', downgradeComponent({component: HsMapComponent}));

angular.module('hs.map', [downgradedMapModule]);

export {HsMapModule} from './map.module';
