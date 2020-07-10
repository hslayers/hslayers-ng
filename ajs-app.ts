'use strict';

import './components/add-layers/add-layers.module';
import './components/datasource-selector/datasource-selector.module';
import './components/draw/draw.module';
import './components/info/info.module';
import './components/measure';
import './components/permalink/permalink.module';
import './components/print';
import './components/legend';
import './components/core';
import './components/query/query.module';
import './components/search/search.module';
import './components/sidebar/sidebar.module';
import './components/styles/styles.module';
import './components/toolbar/toolbar.module';
import * as angular from "angular";
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
import {Style, Fill, Stroke, Circle} from 'ol/style';
import {register} from 'ol/proj/proj4';

declare const window: any;
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
  style: {
    Style,
    Fill,
    Stroke,
    Circle
  },
  View,
  proj
};
export default angular.module('hs', [
  'hs.sidebar',
  'hs.toolbar',
  'hs.layermanager',
  'hs.draw',
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
]).directive('hs', (HsConfig, HsCore) => {
  'ngInject';
  return {
    template: require('hslayers.html'),
    link: function (scope, element, attrs) {
      if (
        typeof HsConfig.sizeMode == 'undefined' ||
        HsConfig.sizeMode == 'fullscreen'
      ) {
        HsCore.fullScreenMap(element);
      }
    },
  };
})
.value('HsConfig', window.hslayersNgConfig ? window.hslayersNgConfig(window.ol) : {})
.controller('Main', ($scope, HsCore, HsMapService, HsConfig) => {
  'ngInject';
  $scope.HsCore = HsCore;
  let lastConfigBuster = HsConfig.buster;
  setInterval(() => {
    if (lastConfigBuster != HsConfig.buster) {
      lastConfigBuster = HsConfig.buster;
      HsMapService.reset();
    }
  }, 100);
});
