import '../core/core.module';
import '../geolocation/geolocation';
import '../map/map.module';
import '../utils/utils.module';
import drawController from './draw.controller';
import drawDirective from './draw.directive';
import drawLayerMetadataComponent from './draw-layer-metadata.component';
import drawService from './draw.service';
import drawShapeToolbarComponent from './draw-shape-toolbar.component';
import removeLayerDialogComponent from './remove-layer-dialog.component';

/**
 * @namespace hs.draw
 * @memberOf hs
 */

angular
  .module('hs.draw', ['hs.map', 'hs.core', 'hs.utils'])
  .factory('HsDrawService', drawService)

  /**
   * @memberof hs.draw
   * @ngdoc component
   * @name hs.draw.shapeToolbar
   * @description Buttons in the corner for controlling drawing
   */
  .component('hs.draw.shapeToolbar', drawShapeToolbarComponent)
  .component('hs.drawLayerMetadata', drawLayerMetadataComponent)
  .component('hs.removeLayerDialog', removeLayerDialogComponent)
  .controller('HsDrawController', drawController)
  .directive('hs.draw.directive', drawDirective);
