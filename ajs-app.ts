'use strict';

import './components/core';
import * as angular from 'angular';
import * as proj from 'ol/proj';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import View from 'ol/View';
import {BingMaps, OSM, TileArcGISRest, TileWMS, WMTS, XYZ} from 'ol/source';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {Group, Image as ImageLayer, Tile} from 'ol/layer';
import {ImageArcGISRest, ImageWMS} from 'ol/source';
import {Vector} from 'ol/source';

declare const window: any;
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
  style: {
    Style,
    Fill,
    Stroke,
    Circle,
    Icon,
  },
  View,
  proj,
};
export default angular
  .module('hs', ['hs.core'])
  .directive('hs', (HsCore) => {
    'ngInject';
    return {
      template: require('./hslayers.html'),
      link: function (_scope, element) {},
    };
  })
  .value(
    'HsConfig',
    window.hslayersNgConfig ? window.hslayersNgConfig(window.ol) : {}
  )
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
