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
            Core.fullScreenMap(element);
        }
    };
}]);

if (window.hslayersNgConfig) module.value('config', Object.assign({}, window.hslayersNgConfig(ol)));

import {Tile, Group, Image as ImageLayer} from 'ol/layer';
import VectorLayer from 'ol/layer/Vector';
import {Vector} from 'ol/source';
import {ImageWMS, ImageArcGISRest} from 'ol/source';
import {BingMaps, TileArcGISRest, TileWMS, WMTS, XYZ, OSM} from 'ol/source';
import {register} from 'ol/proj/proj4'
import * as proj from 'ol/proj';
import View from 'ol/View';
import { Polygon, LineString, GeometryType, Point } from 'ol/geom';
import Feature from 'ol/Feature';


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
    View,
    proj
};

module.controller('Main', ['$scope', 'Core', 'hs.addLayersWms.service_layer_producer', 'hs.compositions.service_parser', 'config',
    function ($scope, Core, srv_producer, composition_parser, config) {
        $scope.Core = Core;
        Core.sidebarRight = false;
        Core.singleDatasources = true;
    }
]);
