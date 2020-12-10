import '../../../common/get-capabilities.module';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import {Tile} from 'ol/layer';
import {addAnchors} from '../../../common/attribution-utils';
import {get} from 'ol/proj';
import {getTopLeft, getWidth} from 'ol/extent';
import {transform, transformExtent} from 'ol/proj';

export default {
  template: require('./add-wmts-layer.directive.html'),
  controller: function (
    $scope,
    HsMapService,
    $compile,
    HsLayoutService,
    $log,
    HsWmtsGetCapabilitiesService,
    HsUtilsService
  ) {
    'ngInject';
    $scope.map_projection = HsMapService.map
      .getView()
      .getProjection()
      .getCode()
      .toUpperCase();
    $scope.style = '';
    $scope.tileMatrixSet = '';
    $scope.image_format = '';

    $scope.connect = function () {
      try {
        HsWmtsGetCapabilitiesService.requestGetCapabilities($scope.url);
      } catch (e) {
        console.warn(e);
      }
      $scope.showDetails = true;
    };

    $scope.$on('ows.wmts_connecting', (event, url, layer) => {
      $scope.layerToAdd = layer;
      $scope.setUrlAndConnect(url);
    });

    $scope.setUrlAndConnect = function (url) {
      $scope.url = url;
      $scope.connect();
    };

    $scope.capabilitiesReceived = function (response) {
      try {
        const parser = new WMTSCapabilities();
        const caps = parser.read(response);
        $scope.caps = caps;
        $scope.title = caps.ServiceIdentification.Title;

        $scope.description = addAnchors(caps.ServiceIdentification.Abstract);
        $scope.version = caps.Version || caps.version;
        $scope.services = caps.Contents.Layer;
      } catch (e) {
        if (console) {
          $log.log(e);
        }
        $scope.error = e.toString();
        const previousDialog = HsLayoutService.contentWrapper.querySelector(
          '.hs-ows-wms-capabilities-error'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs.wmts.capabilities_error_directive></div>'
        );
        HsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)($scope);
        //throw "wmts Capabilities parsing problem";
      }
    };

    $scope.$on('ows_wmts.capabilities_received', (event, response) => {
      $scope.capabilitiesReceived(response.data);
    });


    $scope.checked = function () {
      for (const layer of $scope.services) {
        if (layer.checked) {
          return true;
        }
      }
      return false;
    };
    $scope.changed = function () {
      $scope.isChecked = $scope.checked();
    };

    /**
     * @function addLayer
     * @param checked
     * @memberOf hs.addLayersWmts.controller
     * @description Add layer to map
     * @param {object} layer - Wrapped layer to add
     */
    $scope.tryAddLayers = function (checked) {
      $scope.add_all = checked;
      $scope.addLayers(checked);
      return;
    };

    $scope.addLayers = function (checked) {
      /**
       * @param layer
       */
      function recurse(layer) {
        if (!checked || layer.checked) {
          $scope.addLayer(layer);
        }

        angular.forEach(layer.Layer, (sublayer) => {
          recurse(sublayer);
        });
      }
      angular.forEach($scope.services, (layer) => {
        recurse(layer);
      });
    };

    $scope.getPreferedFormat = function (formats) {
      const prefered = formats.find((format) => format.includes('png'));
      return prefered ? prefered : formats[0];
    };

    $scope.getPreferedMatrixSet = function (sets) {
      const supportedFormats = ['3857', '4326', '5514'];
      const prefered = sets.filter((set) =>
        supportedFormats.some((v) => set.TileMatrixSet.includes(v))
      );
      const prefer3857 = prefered.find((set) =>
        set.TileMatrixSet.includes('3857')
      );
      return prefer3857 ? prefer3857.TileMatrixSet : prefered[0].TileMatrixSet;
    };

    $scope.getPreferedInfoFormat = function (formats) {
      if (formats) {
        const supportedFormats = ['html', 'xml', 'gml'];
        const infos = formats.filter(
          (format) =>
            format.resourceType == 'FeatureInfo' &&
            supportedFormats.some((v) => format.format.includes(v))
        );
        if (infos.length != 0) {
          const preferHTML = infos.find((format) =>
            format.format.includes('html')
          );
          return preferHTML ? preferHTML.format : infos[0].format;
        }
      }
    };

    $scope.addLayer = function (layer) {
      const wmts = new Tile({
        title: layer.Title,
        info_format: $scope.getPreferedInfoFormat(layer.ResourceURL),
        source: new WMTS({}),
      });
      // Get WMTS Capabilities and create WMTS source base on it
      const options = optionsFromCapabilities($scope.caps, {
        layer: layer.Identifier,
        matrixSet: $scope.getPreferedMatrixSet(layer.TileMatrixSetLink),
        format: $scope.getPreferedFormat(layer.Format),
      });
      // WMTS source for raster tiles layer
      const wmtsSource = new WMTS(options);
      // set the data source for raster and vector tile layers
      wmts.setSource(wmtsSource);
      HsMapService.addLayer(wmts, true);
    };
  },
};
