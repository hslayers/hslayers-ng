import 'components/utils/utils.module';
import addLayersArcgisService from './add-layers-arcgis.service';
import addLayersArcgisComponent from './add-layers-arcgis.component';

/**
 * @namespace hs.addLayersArcgis
 * @memberOf hs
 */
angular.module('hs.addLayersArcgis', ['hs.utils', 'hs.getCapabilities'])

    //TODO missing description
    .service('hs.addLayersArcgis.addLayerService', addLayersArcgisService)

    /**
     * @name hs.addLayersArcgis.controller
     * @ngdoc controller
     * @memberOf hs.addLayersArcgis
     * @description Controller for displaying and setting parameters for Arcgis and its layers, which will be added to map afterwards
     */
    .component('hs.addLayersArcgis', addLayersArcgisComponent);
