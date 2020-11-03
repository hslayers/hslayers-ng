import * as angular from 'angular';

import '../../utils';
import moment = require('moment');
import '../../../common/get-capabilities.module';
import VectorLayer from 'ol/layer/Vector';
import WfsSource from '../../layers/hs.source.Wfs';
import {WFS} from 'ol/format';
import {addAnchors} from '../../../common/attribution-utils';
import {getPreferedFormat} from '../../../common/format-utils';

export const HsAddLayersWfsComponent = {
  template: function (HsConfig) {
    'ngInject';
    return {
      template: require('./add-wfs-layer.directive.html'),
    };
  },
  controller: function (
    $scope,
    HsEventBusService,
    HsMapService,
    HsWfsGetCapabilitiesService,
    $compile,
    HsLayoutService,
    $log
  ) {
    'ngInject';
    $scope.map_projection = HsMapService.map
      .getView()
      .getProjection()
      .getCode()
      .toUpperCase();
    HsEventBusService.owsCapabilitiesReceived.subscibe(({type, response}) => {
      if (type !== 'WFS') {
        return;
      }
      try {
        //TODO: create WFSCapabilities if possible
        const caps: any = null; // = new WFSCapabilities(response.data);
        $scope.title = caps.ServiceIdentification.Title;
        $scope.description = addAnchors(caps.ServiceIdentification.Abstract);
        $scope.version = caps.Version || caps.version;
        $scope.output_formats =
          caps.FeatureTypeList.FeatureType[0].OutputFormats;
        $scope.srss = [caps.FeatureTypeList.FeatureType[0].DefaultCRS];
        angular.forEach(caps.FeatureTypeList.FeatureType[0].OtherCRS, (srs) => {
          $scope.srss.push(srs);
        });

        if ($scope.srss.indexOf('CRS:84') > -1) {
          $scope.srss.splice($scope.srss.indexOf('CRS:84'), 1);
        }

        if (
          HsWfsGetCapabilitiesService.currentProjectionSupported($scope.srss)
        ) {
          $scope.srs =
            $scope.srss.indexOf(
              HsMapService.map.getView().getProjection().getCode()
            ) > -1
              ? HsMapService.map.getView().getProjection().getCode()
              : HsMapService.map
                  .getView()
                  .getProjection()
                  .getCode()
                  .toLowerCase();
        } else if ($scope.srss.indexOf('EPSG::4326') > -1) {
          $scope.srs = 'EPSG:4326';
        } else {
          $scope.srs = $scope.srss[0];
        }
        $scope.services = caps.FeatureTypeList.FeatureType;
        angular.forEach(caps.OperationsMetadata.Operation, (operation) => {
          switch (operation.name) {
            case 'DescribeFeatureType':
              $scope.describeFeatureType = operation.DCP[0].HTTP.Get;
              break;
            case 'GetFeature':
              $scope.getFeature = operation.DCP[0].HTTP.Get;
              break;
            default:
          }
        });

        $scope.output_format = getPreferedFormat($scope.output_formats, [
          'text/xml; subtype=gml/3.2.1',
        ]);
      } catch (e) {
        if (console) {
          $log.warn(e);
        }
        $scope.error = e.toString();
        const previousDialog = HsLayoutService.contentWrapper.querySelector(
          '.hs-ows-wms-capabilities-error'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs.add-layers-wfs.capabilities-error-directive></span>'
        );
        $compile(el)($scope);
        HsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        //throw "WMS Capabilities parsing problem";
      }
    });

    /**
     * Clear Url and hide detailsWms
     *
     * @memberof hs.addLayers
     * @function clear
     */
    $scope.clear = function () {
      $scope.url = '';
      $scope.showDetails = false;
    };

    $scope.connect = function () {
      HsWfsGetCapabilitiesService.requestGetCapabilities($scope.url);
      $scope.showDetails = true;
    };

    $scope.$on('ows.wfs_connecting', (event, url) => {
      $scope.setUrlAndConnect(url);
    });

    /**
     * Connect to service of specified Url
     *
     * @memberof hs.addLayersWms
     * @function setUrlAndConnect
     * @param {string} url Url of requested service
     * @param {string} type Type of requested service
     */
    $scope.setUrlAndConnect = function (url) {
      $scope.url = url;
      $scope.connect();
    };

    /**
     * @function selectAllLayers
     * @memberOf hs.addLayersWfs
     * @description Select all layers from service.
     */
    $scope.selectAllLayers = function () {
      /**
       * @param layer
       */
      function recurse(layer) {
        layer.checked = true;

        angular.forEach(layer.Layer, (sublayer) => {
          recurse(sublayer);
        });
      }
      angular.forEach($scope.services.Layer, (layer) => {
        recurse(layer);
      });
    };

    /**
     * @function tryAddLayers
     * @memberOf hs.addLayersWfs
     * @description Callback for "Add layers" button. Checks if current map projection is supported by wms service and warns user about resampling if not. Otherwise proceeds to add layers to the map.
     * @param {boolean} checked - Add all available layers or only checked ones. Checked=false=all
     */
    $scope.tryAddLayers = function (checked) {
      $scope.add_all = checked;
      $scope.addLayers(checked);
      return;
    };

    /**
     * @function addLayers
     * @memberOf hs.addLayersWfs
     * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
     * @param {boolean} checked - Add all available layers or olny checked ones. Checked=false=all
     */
    $scope.addLayers = function (checked) {
      /**
       * @param layer
       */
      function recurse(layer) {
        if (!checked || layer.checked) {
          addLayer(
            layer,
            layer.Title.replace(/\//g, '&#47;'),
            $scope.folder_name,
            $scope.srs
          );
        }

        angular.forEach(layer.Layer, (sublayer) => {
          recurse(sublayer);
        });
      }
      angular.forEach($scope.services, (layer) => {
        recurse(layer);
      });
      HsLayoutService.setMainPanel('layermanager');
    };

    /**
     * @function addLayer
     * @memberOf hs.addLayersWfs
     * @param {object} layer capabilities layer object
     * @param {string} layerName layer name in the map
     * @param {string} folder name
     * @param {OpenLayers.Projection} srs of the layer
     * (PRIVATE) Add selected layer to map???
     */
    function addLayer(layer, layerName, folder, srs) {
      const url = HsWfsGetCapabilitiesService.service_url.split('?')[0];
      const definition: any = {};
      definition.url = url;
      definition.format = 'hs.format.WFS';

      const new_layer = new VectorLayer({
        title: layerName,
        definition: definition,
        source: new WfsSource({
          url: url,
          typename: layer.Name,
          projection: srs,
          version: $scope.version,
          format: new WFS(),
        }),
      });

      HsMapService.map.addLayer(new_layer);
    }
  },
};
