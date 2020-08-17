import '../language/language.module';
import '../measure/measure.module';
import '../utils';
import 'angular-sanitize';
import * as angular from 'angular';
import attributeRowComponent from './attribute-row.component';
import defaultInfoPanelBody from './default-info-panel-body.directive';
import featureComponent from './feature.component';
import featurePopupComponent from './feature-popup.component';
import {HsQueryBaseService} from './query-base.service';
import queryController from './query.controller';
import queryInfoPanelDirective from './query-info-panel.directive';
import queryInfoPanelMdDirective from './query-info-panel-md.directive';
import {HsQueryVectorService} from './query-vector.service';
import queryWmsService from './query-wms.service';
//import '../../common/confirm';
import '../layout';

/**
 * @namespace hs.query
 * @memberOf hs
 * @param $compileProvider
 */
export const HsQueryModule = angular
  .module('hs.query', [
    'hs.map',
    'hs.core',
    'ngSanitize',
    'hs.language',
    'hs.layout',
    'hs.utils',
    'hs.measure',
    // 'hs.common.confirm'
  ])
  /**
   * @ngdoc directive
   * @name hs.query.directiveInfopanel
   * @memberOf hs.query
   * @description Display Infopanel with query results
   */
  .directive('hs.query.directiveInfopanel', queryInfoPanelDirective)

  /**
   * @ngdoc directive
   * @name hs.query.directiveInfopanelMd
   * @memberOf hs.query
   * @description Display Infopanel with query results
   */
  .directive('hs.query.directiveInfopanelMd', queryInfoPanelMdDirective)
  .directive('hs.query.defaultInfoPanelBody', defaultInfoPanelBody)
  /**
   * @ngdoc component
   * @name hs.query.attributeRow
   * @memberOf hs.query
   * @description TODO
   */
  .component('hs.query.attributeRow', attributeRowComponent)

  /**
   * @ngdoc component
   * @name hs.query.feature
   * @memberOf hs.query
   * @description TODO
   */
  .component('hs.query.feature', featureComponent)

  /**
   * @ngdoc service
   * @name HsQueryBaseService
   * @memberOf hs.query
   * @description TODO
   */
  .service('HsQueryBaseService', HsQueryBaseService)

  /**
   * @ngdoc service
   * @name HsQueryWmsService
   * @memberOf hs.query
   * @description TODO
   */
  .factory('HsQueryWmsService', queryWmsService)

  /**
   * @ngdoc service
   * @name HsQueryVectorService
   * @memberOf hs.query
   * @description TODO
   */
  .service('HsQueryVectorService', HsQueryVectorService)

  /**
   * @ngdoc controller
   * @name HsQueryController
   * @memberOf hs.query
   * @description TODO
   */
  .controller('HsQueryController', queryController)

  .component('hs.query.featurePopup', featurePopupComponent)

  .config(function ($compileProvider) {
    'ngInject';
    $compileProvider.aHrefSanitizationWhitelist(
      /^\s*(https?|ftp|mailto|file|blob):/
    );
  });
