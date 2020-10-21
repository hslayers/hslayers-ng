import '../../utils/utils.module';
import * as xml2Json from 'xml-js';
import moment from 'moment';
global.moment = moment;
import '../../../common/get-capabilities.module';
import GML3 from 'ol/format/GML3';
import VectorLayer from 'ol/layer/Vector';
import {WFS} from 'ol/format';
import {bbox} from 'ol/loadingstrategy';
import {get} from 'ol/proj';
import {transform, transformExtent} from 'ol/proj';

import {Vector} from 'ol/source';

export default {
  template: require('./add-wfs-layer.directive.html'),
  controller: function (
    $scope,
    HsMapService,
    HsWfsGetCapabilitiesService,
    $compile,
    HsLayoutService,
    $log,
    HsUtilsService,
    $http
  ) {
    'ngInject';
    $scope.showDetails = false;
    $scope.loaderImage = require('../../../img/ajax-loader.gif');

    $scope.map_projection = HsMapService.map
      .getView()
      .getProjection()
      .getCode()
      .toUpperCase();
    $scope.$on('ows_wfs.capabilities_received', (event, response) => {
      try {
        $scope.loadingFeatures = false;

        let caps = xml2Json.xml2js(response.data, {compact: true});
        if (caps['wfs:WFS_Capabilities']) {
          caps = caps['wfs:WFS_Capabilities'];
        } else {
          caps = caps['WFS_Capabilities'];
        }
        $scope.parseWFSJson(caps);
        $scope.title = caps.ServiceIdentification.Title;
        // $scope.description = addAnchors(caps.ServiceIdentification.Abstract);
        $scope.version = caps.ServiceIdentification.ServiceTypeVersion;
        const layer = Array.isArray(caps.FeatureTypeList.FeatureType)
          ? caps.FeatureTypeList.FeatureType[0]
          : caps.FeatureTypeList.FeatureType;
        $scope.layers = Array.isArray(caps.FeatureTypeList.FeatureType)
          ? caps.FeatureTypeList.FeatureType
          : [caps.FeatureTypeList.FeatureType];
        $scope.output_formats = layer.OutputFormats.Format;
        $scope.bbox = layer.OutputFormats.WGS84BoundingBox;

        if (typeof $scope.output_formats == 'string') {
          $scope.output_formats = [
            $scope.version == '2.0.0' ? 'GML2' : $scope.output_formats,
          ];
        }

        $scope.output_formats.forEach((format, index) => {
          if (format == 'text/xml; subType=gml/3.1.1/profiles/gmlsf/1.0.0/0') {
            $scope.output_formats[index] = 'GML3';
          }
        });
        $scope.output_format = $scope.output_formats[0];

        $scope.services = caps.FeatureTypeList.FeatureType[0]
          ? caps.FeatureTypeList.FeatureType
          : [caps.FeatureTypeList.FeatureType];

        const srsType = layer.DefaultSRS ? 'SRS' : 'CRS';
        if (angular.isDefined(layer['Default' + srsType])) {
          $scope.srss = [layer['Default' + srsType]];
        } else {
          $scope.srss = new Array();
          $scope.srss.push('EPSG:4326');
        }

        const otherSRS = layer['Other' + srsType];
        if (typeof otherSRS == 'string') {
          $scope.srss.push(otherSRS);
        } else {
          angular.forEach(layer['Other' + srsType], (srs) => {
            $scope.srss.push(srs);
          });
        }

        if (angular.isUndefined($scope.srss[0])) {
          $scope.srss = [
            caps.FeatureTypeList.FeatureType[0]['Default' + srsType],
          ];
          angular.forEach(
            caps.FeatureTypeList.FeatureType[0]['Other' + srsType],
            (srs) => {
              $scope.srss.push(srs);
            }
          );
        }
        $scope.srss = $scope.parseEPSG($scope.srss);
        if ($scope.srss.length == 0) {
          $scope.srss = ['EPSG:3857'];
        }
        $scope.srs = $scope.srss[0];

        setTimeout(() => {
          $scope.parseFeatureCount();
        });
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
    $scope.parseFeatureCount = function () {
      angular.forEach($scope.services, (service) => {
        const url = [
          HsWfsGetCapabilitiesService.service_url.split('?')[0],
          HsUtilsService.paramsToURLWoEncode({
            service: 'wfs',
            version: $scope.version == '2.0.0' ? '1.1.0' : $scope.version,
            request: 'GetFeature',
            typeName: service.Name,
            resultType: 'hits',
          }),
        ].join('?');

        $http({
          url: HsUtilsService.proxify(url),
          method: 'GET',
        }).then((response) => {
          const oParser = new DOMParser();
          const oDOM = oParser.parseFromString(
            response.data,
            'application/xml'
          );
          const doc = oDOM.documentElement;
          service.featureCount = doc.getAttribute('numberOfFeatures');
          service.featureCount > 1000
            ? (service.limitFeatureCount = true)
            : (service.limitFeatureCount = false);
        });
      });
    };
    $scope.parseWFSJson = function (json) {
      try {
        for (const key of Object.keys(json)) {
          if (key.includes(':')) {
            json[key.substring(4)] = json[key];
            if (typeof json[key.substring(4)] == 'object') {
              $scope.parseWFSJson(json[key]);
            }
            if (json[key.substring(4)] && json[key.substring(4)]['_text']) {
              json[key.substring(4)] = json[key.substring(4)]['_text'];
            }
            delete json[key];
          }
          if (typeof json[key] == 'object') {
            $scope.parseWFSJson(json[key]);
            if (json[key] && json[key]['_text']) {
              json[key] = json[key]['_text'];
            }
          }
        }
      } catch (e) {
        throw new Error(
          'GetCapabilities parsing failed. Likely unexpected implementation'
        );
      }
    };
    $scope.parseEPSG = function (srss) {
      srss.forEach((srs, index) => {
        const epsgCode = srs.slice(-4);
        srss[index] = 'EPSG:' + epsgCode;
        if (!get(srss[index])) {
          srss.splice(srss.indexOf(index), 1);
        }
      });
      return [...new Set(srss)];
    };
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
        layer.checked = !layer.checked;

        angular.forEach(layer.Layer, (sublayer) => {
          recurse(sublayer);
        });
      }
      angular.forEach($scope.services, (layer) => {
        recurse(layer);
      });
      $scope.changed();
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
      console.log($scope.isChecked);
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
    };

    $scope.readFeatures = function (doc) {
      let features;
      if ($scope.output_format == 'GML3') {
        const gml = new GML3();
        features = gml.readFeatures(doc, {
          dataProjection: this.srs,
          featureProjection: HsMapService.map.getView().getProjection(),
        });
      } else {
        const wfs = new WFS();
        features = wfs.readFeatures(doc, {
          dataProjection: this.srs,
          featureProjection:
            HsMapService.map.getView().getProjection().getCode() == this.srs
              ? ''
              : HsMapService.map.getView().getProjection(),
        });
      }
      return features;
    };

    /**
     * @param options
     */
    $scope.createSRC = function (options) {
      const src = new Vector({
        strategy: bbox,
        loader: function (extent, resolution, projection) {
          this.loadingFeatures = true;
          if (typeof options.version == 'undefined') {
            options.version = '1.0.0';
          }
          if (typeof options.output_format == 'undefined') {
            options.output_format =
              options.version == '1.0.0' ? 'GML2' : 'GML3';
          }

          const srs = options.srs.toUpperCase();
          const calcExtent = options.map
            .getView()
            .calculateExtent(options.map.getSize());
          if (srs.includes('4326') || srs.includes('4258')) {
            extent = [
              calcExtent[1],
              calcExtent[0],
              calcExtent[3],
              calcExtent[2],
            ];
          }

          let url = [
            options.url,
            HsUtilsService.paramsToURLWoEncode({
              service: 'wfs',
              version: options.version == '2.0.0' ? '1.1.0' : options.version,
              request: 'GetFeature',
              typeName: options.layer.Name,
              srsName: srs,
              output_format: options.output_format,
              // count: options.layer.limitFeatureCount ? 1000 : '',
              BBOX:
                transformExtent(extent, projection.getCode(), srs) + ',' + srs,
            }),
          ].join('?');

          url = HsUtilsService.proxify(url);
          $http({
            url: url,
            method: 'GET',
          }).then((response) => {
            let featureString, features;
            if (response) {
              featureString = response.data;
            }
            if (featureString) {
              const oParser = new DOMParser();
              const oDOM = oParser.parseFromString(
                featureString,
                'application/xml'
              );
              const doc = oDOM.documentElement;

              features = options.parser(doc);
              this.addFeatures(features);
              this.loadingFeatures = false;
            }
          });
        },
      });
      return src;
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
      const options = {
        layer: layer,
        url: HsWfsGetCapabilitiesService.service_url.split('?')[0],
        strategy: bbox,
        parser: $scope.readFeatures,
        version: $scope.version,
        output_format: $scope.output_format,
        srs: srs,
        map: HsMapService.map,
      };

      const new_layer = new VectorLayer({
        title: layerName,
        source: $scope.createSRC(options),
        path: $scope.path,
        renderOrder: null,
        synchronize: false,
      });
      HsMapService.map.addLayer(new_layer);
      HsLayoutService.setMainPanel('layermanager');
    }
  },
};
