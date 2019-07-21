import historyListDirective from "./history-list.directive";
import historyListService from "./history-list.service";

export default angular.module('hs.historyList', ['ngCookies'])
    /**
    * @memberof hs.addLayers
    * @ngdoc directive
    * @name compile
    * @description Directive which displays list of previously used urls or any other string
    */
   .directive('hs.historyList', historyListDirective)

    /**
    * @memberof hs.addLayers
    * @ngdoc service
    * @name compile
    * @description Service which reads and writes list of previously used urls or any other string
    */
   .service('hs.historyListService', historyListService)
