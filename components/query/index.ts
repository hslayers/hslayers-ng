/* eslint-disable angular/file-name */
import '../language';
import '../utils';
import 'angular-sanitize';
import * as angular from 'angular';
import {HsQueryAttributeRowComponent} from './attribute-row.component';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryDefaultInfoPanelBodyComponent} from './default-info-panel-body.component';
import {HsQueryFeatureComponent} from './feature.component';
import {HsQueryFeaturePopupComponent} from './feature-popup.component';
import {HsQueryModule} from './query.module';
import {HsQueryVectorService} from './query-vector.service';
import {HsQueryWmtsService} from './query-wmts.service';
import {HsQueryWmsService} from './query-wms.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';
//import '../../common/confirm';
import '../layout';
import {HsQueryComponent} from './query.component';

export const downgradedModule = downgrade(HsQueryModule);

/**
 * @namespace hs.query
 * @memberOf hs
 */
angular
  .module(downgradedModule, [
    'hs.map',
    'ngSanitize',
    'hs.language',
    'hs.layout',
    'hs.utils',
    'hs.measure',
  ])
  .directive(
    'hsQuerydefaultInfoPanelBody',
    downgradeComponent({component: HsQueryDefaultInfoPanelBodyComponent})
  )
  /**
   * @ngdoc component
   * @name hs.query.attributeRow
   * @memberOf hs.query
   * @description TODO
   */
  .directive(
    'hsQueryAttributeRow',
    downgradeComponent({component: HsQueryAttributeRowComponent})
  )

  /**
   * @ngdoc component
   * @name hs-query-feature
   * @memberOf hs.query
   * @description TODO
   */
  .directive(
    'hsQueryFeature',
    downgradeComponent({component: HsQueryFeatureComponent})
  )

  /**
   * @ngdoc service
   * @name HsQueryBaseService
   * @memberOf hs.query
   * @description TODO
   */
  .service('HsQueryBaseService', downgradeInjectable(HsQueryBaseService))

  /**
   * @ngdoc service
   * @name HsQueryWmsService
   * @memberOf hs.query
   * @description TODO
   */
  .service('HsQueryWmsService', downgradeInjectable(HsQueryWmsService))

    /**
   * @ngdoc service
   * @name HsQueryWmtsService
   * @memberOf hs.query
   * @description TODO
   */
  .service('HsQueryWmtsService', downgradeInjectable(HsQueryWmtsService))

  /**
   * @ngdoc service
   * @name HsQueryVectorService
   * @memberOf hs.query
   * @description TODO
   */
  .service('HsQueryVectorService', downgradeInjectable(HsQueryVectorService))

  /**
   * @ngdoc controller
   * @name HsQueryController
   * @memberOf hs.query
   * @description TODO
   */
  .directive('hsQuery', downgradeComponent({component: HsQueryComponent}))

  .directive(
    'hsQueryFeaturePopup',
    downgradeComponent({component: HsQueryFeaturePopupComponent})
  )

  .config(($compileProvider) => {
    'ngInject';
    $compileProvider.aHrefSanitizationWhitelist(
      /^\s*(https?|ftp|mailto|file|blob):/
    );
  });

angular.module('hs.query', [downgradedModule]);

export {HsQueryModule} from './query.module';
