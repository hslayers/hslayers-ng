import '../map/map.module';
import '../core/core';
import '../permalink/permalink.module';
import toolbarComponent from './toolbar.component';

/**
 * @namespace hs.toolbar
 * @memberOf hs
 */
var module = angular.module('hs.toolbar', ['hs.map', 'hs.core', 'hs.layout']);

/**
 * @memberof hs.toolbar
 * @ngdoc component
 * @name hs.toolbar
 * @description Add toolbar to map (search field, full map button and measure button)
 */
module.component('hs.toolbar', toolbarComponent);
