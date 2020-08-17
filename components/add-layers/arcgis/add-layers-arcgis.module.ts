import '../../utils';
import * as angular from 'angular';
import addLayersArcgisComponent from './add-layers-arcgis.component';
import addLayersArcgisService from './add-layers-arcgis.service';

/**
 * @namespace hs.addLayersArcgis
 * @memberOf hs
 */
angular
  .module('hs.addLayersArcgis', ['hs.utils', 'hs.getCapabilities'])

  //TODO missing description
  .factory('HsAddLayersArcgisAddLayerService', addLayersArcgisService)

  /**
   * @name hs.addLayersArcgis.controller
   * @ngdoc controller
   * @memberOf hs.addLayersArcgis
   * @description Controller for displaying and setting parameters for Arcgis and its layers, which will be added to map afterwards
   */
  .component('hs.addLayersArcgis', addLayersArcgisComponent);
