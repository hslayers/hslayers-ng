import dragDirective from "./drag.directive";

/**
 * @namespace hs.drag
 * @memberOf hs
 */
angular.module('hs.drag', [])
    /**
    * @name hs.draggable
    * @ngdoc directive
    * @memberof hs.drag
    * @description Directive which allows dragging of application element
    */
    .directive('hs.draggable', dragDirective);
