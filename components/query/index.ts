/* eslint-disable angular/file-name */
import * as angular from 'angular';
import {HsQueryModule} from './query.module';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';
import '../language/language.module';
import '../measure/measure.module';
import '../utils';
import 'angular-sanitize';
import HsQueryAttributeRowComponent from './attribute-row.component';
import HsQueryDefaultInfoPanelBody from './default-info-panel-body.directive';
import HsQueryFeatureComponent from './feature.component';
import featurePopupComponent from './feature-popup.component';
import {HsQueryBaseService} from './query-base.service';
import HsQueryInfoPanelMdDirective from './query-info-panel-md.directive';
import {HsQueryVectorService} from './query-vector.service';
import HsQueryWmsService from './query-wms.service';
//import '../../common/confirm';
import '../layout';

export const downgradedModule = downgrade(HsQueryModule);

/**
 * @namespace hs.query
 * @memberOf hs
 */
angular
  .module(downgradedModule, [
    'hs.map',
    'hs.core',
    'ngSanitize',
    'hs.language',
    'hs.layout',
    'hs.utils',
    'hs.measure',
  ]) /**

 /**
  * @ngdoc directive
  * @name hs.query.directiveInfopanelMd
  * @memberOf hs.query
  * @description Display Infopanel with query results
  */
 .directive('hs.query.directiveInfopanelMd', downgradeComponent({HsQueryInfoPanelMdDirective}))
 .directive('hs.query.defaultInfoPanelBody', downgradeComponent({HsQueryDefaultInfoPanelBody}))
 /**
  * @ngdoc component
  * @name hs.query.attributeRow
  * @memberOf hs.query
  * @description TODO
  */
 .directive('hs.query.attributeRow', downgradeComponent({ HsQueryAttributeRowComponent}))

 /**
  * @ngdoc component
  * @name hs.query.feature
  * @memberOf hs.query
  * @description TODO
  */
 .directive('hs.query.feature', downgradeComponent({HsQueryFeatureComponent}))

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
 .directive('HsQuery', downgradeComponent({component: HsQueryComponent})

 .directive('hs.query.featurePopup', downgradeComponent({component: featurePopupComponent})

 .config(function ($compileProvider) {
   'ngInject';
   $compileProvider.aHrefSanitizationWhitelist(
     /^\s*(https?|ftp|mailto|file|blob):/
   );
 })

  .service(
    'HsLayerSynchronizerService',
    downgradeInjectable(HsLayerSynchronizerService)
  )

  .directive(
    'hsSyncErrorDialog',
    downgradeComponent({component: HsSyncErrorDialogComponent})
  );

angular.module('hs.query', [downgradedModule]);

export {HsQueryModule} from './query.module';
