import '../core/core.module';
import '../map/map.module';
import '../permalink/permalink.module';
import toolbarComponent from './toolbar.component';
import * as angular from "angular";
import {downgradedLayoutModule} from '../layout';
/**
 * @namespace hs.toolbar
 * @memberOf hs
 */
angular
  .module('hs.toolbar', ['hs.map', 'hs.core', downgradedLayoutModule])

  /**
   * @memberof hs.toolbar
   * @ngdoc component
   * @name hs.toolbar
   * @description Add toolbar to map (search field, full map button and measure button)
   */
  .component('hs.toolbar', toolbarComponent);
