
import 'angular-sanitize';
import queryInfoPanelDirective from './query-info-panel.directive';
import queryInfoPanelMdDirective from './query-info-panel-md.directive';
import queryInfovalueDirective from './query-infovalue.directive';
import queryBaseService from './query-base.service';
import queryWmsService from './query-wms.service';
import queryVectorService from './query-vector.service';
import queryController from './query.controller';

/**
 * @namespace hs.query
 * @memberOf hs
 */
angular.module('hs.query', ['hs.map', 'hs.core', 'ngSanitize'])
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
    * @ngdoc directive
    * @name hs.query.infovalue
    * @memberOf hs.query
    * @description TODO
    */
    .directive('hs.query.infovalue', queryInfovalueDirective)

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
    .controller('hs.query.controller', queryController);
