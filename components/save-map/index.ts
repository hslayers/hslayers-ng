/* eslint-disable angular/file-name */
import '../../common/endpoints/endpoints.module';
import '../../common/get-capabilities.module';
import '../../common/layman/layman.module';
import '../../common/widgets/widgets.module';
import '../utils';
import * as angular from 'angular';
import {HsLayerSynchronizerService} from './layer-synchronizer.service';
import {HsLaymanService} from './layman.service';
import {HsSaveMapComponent} from './save-map.component';
import {HsSaveMapDialogComponent} from './save-map-dialog.component';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapModule} from './save-map.module';
import {HsSaveMapResultDialogComponent} from './save-map.result-dialog.component';
import {HsSaveMapService} from './save-map.service';
import {HsSaveMapSimpleFormComponent} from './save-map-simple-form.component';
import {HsStatusManagerService} from './status-manager.service';
import {HsSyncErrorDialogComponent} from './sync-error-dialog.component';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsSaveMapModule);

/**
 * @namespace hs.save-map
 * @memberOf hs
 */
angular
  .module(downgradedModule, [
    'hs.map',
    'hs.widgets',
    'hs.utils',
    'hs.common.layman',
  ])

  /**
   * @ngdoc directive
   * @name hs.saveMap.directiveSimpleform
   * @memberof hs.save-map
   * @description Display simple form to collect information (metadata) about saved composition
   */
  .directive(
    'hs.saveMap.directiveSimpleform',
    downgradeComponent({component: HsSaveMapSimpleFormComponent})
  )

  /**
   * @ngdoc directive
   * @name hs.saveMap.resultDialogDirective
   * @memberof hs.save-map
   * @description Display dialog about result of saving to status manager operation
   */
  .directive(
    'hs.saveMap.resultDialogDirective',
    downgradeComponent({component: HsSaveMapResultDialogComponent})
  )

  /**
   * @ngdoc directive
   * @name hs.saveMap.saveDialogDirective
   * @memberof hs.save-map
   * @description Display saving dialog (confirmation of saving, overwriting, selection of name)
   */
  .directive(
    'hs.saveMap.saveDialogDirective',
    downgradeComponent({component: HsSaveMapDialogComponent})
  )

  /**
   * @ngdoc service
   * @name HsSaveMapService
   * @memberof hs.save-map
   * @description Service for converting composition and composition data into JSON object which can be saved on server
   */
  .service('HsSaveMapService', downgradeInjectable(HsSaveMapService))

  /**
   * @ngdoc service
   * @name HsSaveMapService
   * @memberof hs.save-map
   * @description Service for managing saving logic to various providers.
   * Currently Layman and Status manager are supported.
   */
  .service(
    'HsSaveMapManagerService',
    downgradeInjectable(HsSaveMapManagerService)
  )

  /**
   * @ngdoc service
   * @name HsLaymanService
   * @memberof hs.save-map
   * @description Service for sending and retrieving compositions from Status
   * Manager backend
   */
  .service(
    'HsStatusManagerService',
    downgradeInjectable(HsStatusManagerService)
  )

  /**
   * @ngdoc service
   * @name HsLaymanService
   * @memberof hs.save-map
   * @description Service for sending and retrieving data from Layman
   * (compositions, layers) (https://github.com/jirik/gspld)
   */
  .service('HsLaymanService', downgradeInjectable(HsLaymanService))

  /**
   * @ngdoc service
   * @name HsLayerSynchronizerService
   * @memberof hs.save-map
   * @description Service which monitors vector layers and initiates sending
   * and gets requesting of features to/from Layman
   */
  .service(
    'HsLayerSynchronizerService',
    downgradeInjectable(HsLayerSynchronizerService)
  )

  /**
   * @ngdoc component
   * @name hs.saveMap
   * @memberof hs.save-map
   * @description Save map panel
   */
  .directive('hs.saveMap', downgradeComponent({component: HsSaveMapComponent}))

  .directive(
    'hsSyncErrorDialog',
    downgradeComponent({component: HsSyncErrorDialogComponent})
  );

angular.module('hs.save-map', [downgradedModule]);

export {HsSaveMapModule} from './save-map.module';
