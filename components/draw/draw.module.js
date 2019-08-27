import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';
import 'components/map/map.module';
import 'core'
import 'components/utils/utils.module'
import 'geolocation';
import drawService from './draw.service';
import drawShapeToolbarComponent from './draw-shape-toolbar.component';

/**
* @namespace hs.draw
* @memberOf hs
*/

angular.module('hs.draw', ['hs.map', 'hs.core', 'hs.utils'])
    .service('hs.draw.service', drawService)

    /**
     * @memberof hs.draw
     * @ngdoc component
     * @name hs.draw.shapeToolbar
     * @description Buttons in the corner for controlling drawing
     */
    .component('hs.draw.shapeToolbar', drawShapeToolbarComponent);
