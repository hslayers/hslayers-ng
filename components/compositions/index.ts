import '../../common/endpoints/';
import '../permalink/';
import '../save-map/';
import '../styles';
import '../utils';
import './endpoints/';
import './layer-parser/';
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
 * @description composition module
 */
angular
  .module(downgradedModule, [
    'hs.map',
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
   * @description Display dialog window for situation, when new composition is to be loaded while there are unsaved changes in old composition
   */
  .directive(
    'hsCompositionsOverwriteDialog',
    downgradeComponent({component: HsCompositionsOverwriteDialogComponent})
  )

  /**
   * @description Display dialog window for confiriming deletion of selected composition
   */
  .directive(
    'hsCompositionsDeleteDialog',
    downgradeComponent({component: HsCompositionsDeleteDialogComponent})
  )

  /**
   * @description Display dialog of sharing composition (URL / Social networks)
   */
  .directive(
    'hsCompositionsShareDialog',
    downgradeComponent({component: HsCompositionsShareDialogComponent})
  )

  /**
   * @description Display dialog of composition info (name, abstract, thumbnail, extent, layers)
   */
  .directive(
    'hsCompositionsInfoDialog',
    downgradeComponent({component: HsCompositionsInfoDialogComponent})
  )

  /**
   * @description Service of composition module
   */
  .service('HsCompositionsService', downgradeInjectable(HsCompositionsService))

  /**
   * @description Service of composition module which deal ith Openlayers map objects
   */
  .service(
    'HsCompositionsMapService',
    downgradeInjectable(HsCompositionsMapService)
  )

  /**
   * @description Contains function of managing composition (loading, removing Layers)
   */
  .service(
    'HsCompositionsParserService',
    downgradeInjectable(HsCompositionsParserService)
  )

  /**
   * @description Main controller of composition module
   */
  .directive(
    'hsCompositions',
    downgradeComponent({component: HsCompositionsComponent})
  );

angular.module('hs.compositions', [downgradedModule]);

export {HsCompositionsModule} from './compositions.module';
