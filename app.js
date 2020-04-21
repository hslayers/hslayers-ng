'use strict';

import 'add-layers.module';
import 'datasource-selector.module';
import 'info.module';
import 'measure.module';
import 'permalink.module';
import 'print.module';
import 'query.module';
import 'search.module';
import 'sidebar.module';
import 'styles.module';
import 'toolbar.module';

const mainModuleBs = angular.module('hs', [
  'hs.sidebar',
  'hs.toolbar',
  'hs.layermanager',
  'hs.map',
  'hs.query',
  'hs.search',
  'hs.print',
  'hs.permalink',
  'hs.measure',
  'hs.legend',
  'hs.geolocation',
  'hs.core',
  'hs.datasource_selector',
  'hs.save-map',
  'hs.addLayers',
  'gettext',
  'hs.compositions',
  'hs.info',
  'hs.styles',
]);

mainModuleBs.directive('hs', [
  'config',
  'Core',
  function (config, Core) {
    return {
      template: require('hslayers.html'),
      link: function (scope, element, attrs) {
        if (
          typeof config.sizeMode == 'undefined' ||
          config.sizeMode == 'fullscreen'
        ) {
          Core.fullScreenMap(element);
        }
      },
    };
  },
]);

import * as proj from 'ol/proj';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import {BingMaps, OSM, TileArcGISRest, TileWMS, WMTS, XYZ} from 'ol/source';
import {GeometryType, LineString, Point, Polygon} from 'ol/geom';
import {Group, Image as ImageLayer, Tile} from 'ol/layer';
import {ImageArcGISRest, ImageWMS} from 'ol/source';
import {Vector} from 'ol/source';
import {register} from 'ol/proj/proj4';

window.ol = {
  layer: {
    Tile,
    Group,
    Image: ImageLayer,
    Vector: VectorLayer,
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
    ImageArcGISRest,
  },
  format: {
    GeoJSON,
  },
  View,
  proj,
};

if (window.hslayersNgConfig) {
  mainModuleBs.value('config', window.hslayersNgConfig(window.ol));
}

mainModuleBs.controller('Main', [
  '$scope',
  'Core',
  'config',
  'hs.map.service',
  function ($scope, Core, config, hsMap) {
    $scope.Core = Core;
    let lastConfigBuster = config.buster;
    setInterval(() => {
      if (lastConfigBuster != config.buster) {
        lastConfigBuster = config.buster;
        hsMap.reset();
      }
    }, 100);
  },
]);
