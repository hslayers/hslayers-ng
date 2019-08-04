import '../map/map.module';
import '../core/core';
import infoComponent from './info.component';

/**
 * @ngdoc module
 * @module hs.info
 * @name hs.info
 * @description Module responsible for info application status information window. Contain HS-Layers default info template and its controller. When included, it also updates webpage meta tags with current map information.
 */
angular.module('hs.info', ['hs.map', 'hs.core'])
    /**
     * @module info
     * @name hs.info
     * @ngdoc component
     * @description Automatically updates composition abstract and status when composition is changed through appropriete composition / layermanager events. Shows mainly current composition status. Also display loading sign when composition is loading. 
     */
    .component('hs.info', infoComponent);
