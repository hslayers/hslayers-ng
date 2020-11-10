import * as angular from 'angular';
import {HsCesiumCameraService} from './hscesium-camera.service';
import {HsCesiumComponent} from './hscesium.component';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsCesiumModule} from './hscesium.module';
import {HsCesiumService} from './hscesium.service';
import {HsCesiumTimeService} from './hscesium-time.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsCesiumModule);

/**
 * @ngdoc module
 * @module hs.cesium
 * @name hs.cesium
 * @description Module containing cesium map
 * @param config
 * @param service
 * @param $timeout
 */
angular
  .module(downgradedModule, [])

  /**
   * @module hs.cesium
   * @name HsCesiumService
   * @ngdoc service
   * @description Contains map object and few utility functions working with whole map. Map object get initialized with default view specified in config module (mostly in app.js file).
   */
  .service('HsCesiumService', downgradeInjectable(HsCesiumService))

  /**
   * @module hs.cesium
   * @name HsCesiumTime
   * @ngdoc service
   * @description Manages cesium timeline integration with HsLayers
   */
  .service('HsCesiumTimeService', downgradeInjectable(HsCesiumTimeService))

  /**
   * @module hs.cesium
   * @name HsCesiumTime
   * @ngdoc service
   * @description Manages cesium and openlayers layers integration
   */
  .service('HsCesiumLayersService', downgradeInjectable(HsCesiumLayersService))

  /**
   * @module hs.cesium
   * @name HsCesiumTime
   * @ngdoc service
   * @description Manages cesium and openlayers camera synchronization
   */
  .service('HsCesiumCameraService', downgradeInjectable(HsCesiumCameraService))

  .directive('hsCesium', downgradeComponent({component: HsCesiumComponent}));

angular.module('hs.cesium', [downgradedModule]);

export {HsCesiumModule} from './hscesium.module';
