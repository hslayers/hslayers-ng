
import 'angular-sanitize';
import queryInfoPanelDirective from './query-info-panel.directive';
import queryInfoPanelMdDirective from './query-info-panel-md.directive';
import attributeRowComponent from './attribute-row.component';
import queryBaseService from './query-base.service';
import queryWmsService from './query-wms.service';
import queryVectorService from './query-vector.service';
import queryController from './query.controller';
import featureComponent from './feature.component';
import 'language.module';

/**
 * @namespace hs.query
 * @memberOf hs
 */
angular.module('hs.query', ['hs.map', 'hs.core', 'ngSanitize', 'hs.language', 'hs.layout'])
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
    * @name hs.query.baseService
    * @memberOf hs.query
    * @description TODO
    */
    .service('hs.query.baseService', queryBaseService)
    
    /**
    * @ngdoc service
    * @name hs.query.wmsService
    * @memberOf hs.query
    * @description TODO
    */
    .service('hs.query.wmsService', queryWmsService)

    /**
    * @ngdoc service
    * @name hs.query.vectorService
    * @memberOf hs.query
    * @description TODO
    */
    .service('hs.query.vectorService', queryVectorService)

    /**
    * @ngdoc controller
    * @name hs.query.controller
    * @memberOf hs.query
    * @description TODO
    */
    .controller('hs.query.controller', queryController)
    
    .config(['$compileProvider',
        function($compileProvider) {
            $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|blob):/);
        }
    ]);
