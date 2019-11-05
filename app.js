'use strict';

import 'toolbar.module';
import 'print.module';
import 'query.module';
import 'search.module';
import 'measure.module';
import 'permalink.module';
import 'info.module';
import 'datasource-selector.module';
import 'sidebar.module';
import 'add-layers.module';
import 'styles.module';

var module = angular.module('hs', [
    'hs.sidebar',
    'hs.toolbar',
    'hs.layermanager',
    'hs.map',
    'hs.query',
    'hs.search', 'hs.print', 'hs.permalink', 'hs.measure',
    'hs.legend', 'hs.geolocation', 'hs.core',
    'hs.datasource_selector',
    'hs.save-map',
    'hs.addLayers',
    'gettext',
    'hs.compositions',
    'hs.info',
    'hs.styles'
]);

module.directive('hs', ['config', 'Core', function (config, Core) {
    return {
        template: require('hslayers.html'),
        link: function (scope, element, attrs) {
            if (typeof config.sizeMode == 'undefined' || config.sizeMode == 'fullscreen')
                Core.fullScreenMap(element);
        }
    };
}]);

import { Tile, Group, Image as ImageLayer } from 'ol/layer';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import { BingMaps, TileArcGISRest, TileWMS, WMTS, XYZ, OSM } from 'ol/source';
import { register } from 'ol/proj/proj4'
import * as proj from 'ol/proj';
import View from 'ol/View';
import { Polygon, LineString, GeometryType, Point } from 'ol/geom';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';

window.ol = {
    layer: {
        Tile,
        Group,
        Image: ImageLayer,
        Vector: VectorLayer
    },
    source: {
        OSM,
        XYZ,
        TileWMS,
        Vector,
        WMTS,
        TileArcGISRest,
        BingMaps,
        ImageWMS,
        ImageArcGISRest
    },
    format: {
        GeoJSON
    },
    View,
    proj
};

if (window.hslayersNgConfig) module.value('config', window.hslayersNgConfig(window.ol));

module.controller('Main', ['$scope', 'Core', 'config', 'hs.map.service',
    function ($scope, Core, config, hsMap) {
        $scope.Core = Core;
        Core.singleDatasources = true;
        let lastConfigBuster = config.buster;
        setInterval(function () {
            if (lastConfigBuster != config.buster) {
                lastConfigBuster = config.buster;
                hsMap.reset();
            }
        }, 100)
    }
]);
