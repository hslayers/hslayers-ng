import '../core/';
import '../layout';
import '../map/map.module';
import '../permalink/share.module';
import * as angular from 'angular';
import toolbarComponent from './toolbar.component';
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
