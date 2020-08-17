import '../core/';
import '../geolocation/geolocation.module';
import '../map/map.module';
import '../utils';
import './draw.module';
import vgiDrawComponent from './vgi-draw.component';
import * as angular from 'angular';

/**
 * @namespace hs.vgi-draw
 * @memberOf hs
 */

angular
  .module('hs.vgi-draw', [
    'hs.map',
    'hs.core',
    'hs.utils',
    'hs.geolocation',
    'hs.save-map',
    'hs.draw',
  ])
  /**
   * @name hs.vgi-draw.toolbar-button-directive
   * @ngdoc directive
   * @memberof hs.vgi-draw
   * @description Display draw toolbar button in map
   */
  .directive('hs.vgiDraw.toolbarButtonDirective', [
    'HsConfig',
    function (config) {
      return {
        template: require('./partials/toolbar_button_directive.html'),
      };
    },
  ])

  /**
   * @name hs.vgiLayerManagerButton
   * @ngdoc directive
   * @memberof hs.vgi-draw
   * @description Button for adding layer in layer manager panel
   */
  .directive('hs.vgiLayerManagerButton', [
    'HsConfig',
    function (config) {
      return {
        template: require('./partials/layer-manager-button.html'),
        replace: true,
      };
    },
  ])

  /**
   * @name hs.vgi-draw
   * @ngdoc component
   * @memberof hs.vgi-draw
   * @description Component for draw features and sending them to Senslog VGI
   * backend. Display draw feature panel in map. Panel contains active layer
   * selector, geometry selector and information editor for new features.
   */
  .component('hs.vgiDraw', vgiDrawComponent);
