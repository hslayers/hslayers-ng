import 'components/map/map.module';
import 'core'
import 'components/utils/utils.module'
import 'geolocation';
import 'draw.module';
import vgiDrawComponent from './vgi-draw.component';

/**
* @namespace hs.vgi-draw
* @memberOf hs
*/

angular.module('hs.vgi-draw', ['hs.map', 'hs.core', 'hs.utils', 'hs.geolocation', 'hs.save-map', 'hs.draw'])
    /**
    * @name hs.vgi-draw.toolbar-button-directive
    * @ngdoc directive
    * @memberof hs.vgi-draw
    * @description Display draw toolbar button in map
    */
    .directive('hs.vgiDraw.toolbarButtonDirective', ['config', function (config) {
        return {
            template: require('components/draw/partials/toolbar_button_directive.html')
        };
    }])

    /**
    * @name hs.vgiLayerManagerButton
    * @ngdoc directive
    * @memberof hs.vgi-draw
    * @description Button for adding layer in layer manager panel
    */
    .directive('hs.vgiLayerManagerButton', ['config', function (config) {
        return {
            template: require('./partials/layer-manager-button.html'),
            replace: true
        };
    }])

    /**
    * @name hs.vgi-draw
    * @ngdoc component
    * @memberof hs.vgi-draw
    * @description Component for draw features and sending them to Senslog VGI 
    * backend. Display draw feature panel in map. Panel contains active layer 
    * selector, geometry selector and information editor for new features.
    */
    .component('hs.vgiDraw', vgiDrawComponent);
