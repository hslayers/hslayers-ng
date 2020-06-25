import '../core/';
import '../map/map.module';
import '../permalink/permalink.module';
import toolbarComponent from './toolbar.component';
import * as angular from "angular";
import '../layout';
/**
 * @namespace hs.toolbar
 * @memberOf hs
 */
angular
  .module('hs.toolbar', ['hs.map', 'hs.core', 'hs.layout'])

  /**
   * @memberof hs.toolbar
   * @ngdoc component
   * @name hs.toolbar
   * @description Add toolbar to map (search field, full map button and measure button)
   */
  .component('hs.toolbar', toolbarComponent);
