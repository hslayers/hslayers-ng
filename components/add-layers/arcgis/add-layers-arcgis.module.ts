import '../../utils';
import * as angular from 'angular';
import {HsAddLayersArcGisComponent} from './add-layers-arcgis.component';
import {HsAddLayersArcGisService} from './add-layers-arcgis.service';

/**
 * @namespace hs.addLayersArcgis
 * @memberOf hs
 */
angular
  .module('hs.addLayersArcgis', ['hs.utils', 'hs.getCapabilities'])

  .factory('HsAddLayersArcgisAddLayerService', HsAddLayersArcGisService)

  /**
   * @name hs.addLayersArcgis.controller
   * @ngdoc controller
   * @memberOf hs.addLayersArcgis
   * @description Controller for displaying and setting parameters for Arcgis and its layers, which will be added to map afterwards
   */
  .component('hs.addLayersArcgis', HsAddLayersArcGisComponent);
