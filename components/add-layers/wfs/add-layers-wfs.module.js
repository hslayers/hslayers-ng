import 'components/utils/utils.module';
import '../../../common/get-capabilities.module';
import capabilitiesErrorDirective from '../capabilities-error.directive';
import addLayersWfsComponent from './add-layers-wfs.component';

/**
* @namespace hs.addLayersWfs
* @memberOf hs
*/
angular.module('hs.addLayersWfs', ['hs.utils', 'hs.getCapabilities'])

    /**
    * @name hs.addLayersWfs.capabalitiesErrorDirective
    * @ngdoc directive
    * @memberOf hs.addLayersWfs
    * @description Display GetCapabilities error dialog template
    */
    .directive('hs.addLayersWfs.capabilitiesErrorDirective', capabilitiesErrorDirective)

    /**
     * @name hs.addLayersWfs
     * @ngdoc controller
     * @memberOf hs.addLayersWfs
     * @description Controller for displaying and setting parameters for Wfs and its layers, which will be added to map afterwards
     */
    .component('hs.addLayersWfs', addLayersWfsComponent);
