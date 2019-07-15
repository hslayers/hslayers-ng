import '../permalink/permalink.module';
import mapService from './map.service';
import mapDirective from './map.directive';
import mapController from './map.controller';

/**
 * @ngdoc module
 * @module hs.map
 * @name hs.map
 * @description Module containing service and controller for main map object (ol.Map).
 */
angular.module('hs.map', ['hs'])

    /**
     * @module hs.map
     * @name hs.map.service
     * @ngdoc service
     * @description Contains map object and few utility functions working with whole map. Map object get initialized with default view specified in config module (mostly in app.js file), and basic set of {@link hs.map.service#interactions interactions}.
     */
    .service('hs.map.service', mapService)

    /**
     * @module hs.map
     * @name hs.map.directive
     * @ngdoc directive
     * @description Map directive, for map template (not needed for map itself, but other components which might be displayed in map window, e.g. {@link hs.geolocation.directive geolocation})
     */
    .directive('hs.map.directive', mapDirective)

    /**
     * @module hs.map
     * @name hs.map.controller
     * @ngdoc controller
     * @description Main controller of default HSLayers map, initialize map service when default HSLayers template is used
     */
    .controller('hs.map.controller', mapController);
