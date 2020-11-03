import * as angular from 'angular';
import {HsAddLayersVectorComponent} from './add-layers-vector.component';
import {HsAddLayersVectorModule} from './add-layers-vector.module';
import {HsAddLayersVectorService} from './add-layers-vector.service';
import {HsVectorUrlParserService} from './add-layers-vector-url-parser.service';
import {downgrade} from '../../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedAddLayersVectorModule = downgrade(
  HsAddLayersVectorModule
);

/**
 * @namespace hs.addLayersVector
 * @memberof hs
 */
angular
  .module(downgradedAddLayersVectorModule, [
    'hs.styles',
    'gettext',
    'hs.utils',
    'hs.layout',
    'hs.map',
  ])
  /**
   * @memberof hs.addLayersVector
   * @ngdoc directive
   * @name hs.addLayersVector
   * @description TODO
   */
  .directive(
    'hs.addLayersVector',
    downgradeComponent({component: HsAddLayersVectorComponent})
  )

  /**
   * @memberof hs.addLayersVector
   * @ngdoc service
   * @name HsAddLayersVectorService
   * @description Service handling adding nonwms OWS services or files. Handles also drag and drop addition.
   */
  .service(
    'HsAddLayersVectorService',
    downgradeInjectable(HsAddLayersVectorService)
  )

  /**
   * @memberof hs.addLayersVector
   * @ngdoc service
   * @name hs.ddLayersVectorUrlParser.service
   * @description Service handling loading of vector layers through url params
   */
  .service(
    'hs.addLayersVectorUrlParser.service',
    downgradeInjectable(HsVectorUrlParserService)
  );

angular.module('hs.addLayersVector', [downgradedAddLayersVectorModule]);

export {HsAddLayersVectorModule} from './add-layers-vector.module';
