import '../../common/endpoints/endpoints.module';
import '../layout/layout.module';
import '../permalink/';
import '../save-map/';
import '../styles';
import '../utils';
import './endpoints/compositions-endpoints.module';
import './layer-parser/layer-parser.module';
import * as angular from 'angular';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsMapService} from './compositions-map.service';
import {HsCompositionsModule} from './compositions.module';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsParserService} from './compositions-parser.service';
import {HsCompositionsService} from './compositions.service';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';
export const downgradedModule = downgrade(HsCompositionsModule);

/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Test composition module
 */
angular
  .module(downgradedModule, [
    'hs.map',
    'hs.core',
    'hs.compositions.layerParser',
    'hs.compositions.endpoints',
    'hs.common.endpoints',
    'hs.utils',
    'hs.layout',
    'hs.permalink',
    'hs.save-map',
    'hs.styles',
    'hs',
  ])
  /**
   * @module hs.compositions
   * @name hs.compositions.overwriteDialogDirective
   * @ngdoc directive
   * @description Display dialog window for situation, when new composition is to be loaded while there are unsaved changes in old composition
   */
  .directive(
    'hs.compositions.overwriteDialogDirective',
    downgradeComponent({component: HsCompositionsOverwriteDialogComponent})
  )

  /**
   * @module hs.compositions
   * @name hs.compositions.deleteDialogDirective
   * @ngdoc directive
   * @description Display dialog window for confiriming deletion of selected composition
   */
  .directive(
    'hs.compositions.deleteDialogDirective',
    downgradeComponent({component: HsCompositionsDeleteDialogComponent})
  )

  /**
   * @module hs.compositions
   * @name hs.compositions.shareDialogDirective
   * @ngdoc directive
   * @description Display dialog of sharing composition (URL / Social networks)
   */
  .directive(
    'hs.compositions.shareDialogDirective',
    downgradeComponent({component: HsCompositionsShareDialogComponent})
  )

  /**
   * @module hs.compositions
   * @name hs.compositions.infoDialogDirective
   * @ngdoc directive
   * @description Display dialog of composition info (name, abstract, thumbnail, extent, layers)
   */
  .directive(
    'hs.compositions.infoDialogDirective',
    downgradeComponent({component: HsCompositionsInfoDialogComponent})
  )

  /**
   * @module hs.compositions
   * @name HsCompositionsService
   * @ngdoc controller
   * @description Service of composition module
   */
  .service('HsCompositionsService', downgradeInjectable(HsCompositionsService))

  /**
   * @module hs.compositions
   * @name HsCompositionsMapService
   * @ngdoc controller
   * @description Service of composition module which deal ith Openlayers map objects
   */
  .service(
    'HsCompositionsMapService',
    downgradeInjectable(HsCompositionsMapService)
  )

  /**
   * @module hs.compositions
   * @name HsCompositionsParserService
   * @ngdoc service
   * @description Contains function of managing composition (loading, removing Layers)
   */
  .service(
    'HsCompositionsParserService',
    downgradeInjectable(HsCompositionsParserService)
  )

  /**
   * @module hs.compositions
   * @name hs.compositions
   * @ngdoc component
   * @description Main controller of composition module
   */
  .directive(
    'hs.compositions',
    downgradeComponent({component: HsCompositionsComponent})
  );

angular.module('hs.compositions', [downgradedModule]);

export {HsCompositionsModule} from './compositions.module';
