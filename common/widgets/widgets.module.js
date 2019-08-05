import objectDirective from './object.directive';

/**
* @namespace hs.common
* @memberOf hs
*/
angular.module('hs.widgets', [])


    /**
     * @ngdoc directive
     * @name hs.datasourceSelector.objectDirective
     * @memberOf hs.widgets
     * @description Universal directive for displaying metadata about data source
     */
    .directive('hs.widgets.objectDirective', objectDirective)