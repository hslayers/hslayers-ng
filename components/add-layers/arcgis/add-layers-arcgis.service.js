import '../../utils/utils.module';
import {Tile} from 'ol/layer';
import {TileArcGISRest} from 'ol/source';
import {Attribution} from 'ol/control';
import {getPreferedFormat} from '../../../common/format-utils';
import '../../../common/get-capabilities.module';
import {addAnchors} from '../../../common/attribution-utils';
import 'angular-cookies';

export default ['$rootScope', 'hs.map.service', 'hs.arcgis.getCapabilitiesService',
  'Core', 'hs.dimensionService', '$timeout', 'hs.layout.service',
  function ($rootScope, OlMap, ArcgisCapsService, Core, dimensionService, $timeout, layoutService) {
    const me = this;

    this.data = {
      useResampling: false,
      useTiles: true,
      mapProjection: undefined,
      registerMetadata: true,
      tileSize: 512
    };

    this.capabilitiesReceived = function (response, layerToSelect) {
      try {
        const caps = response;
        me.data.mapProjection = OlMap.map.getView().getProjection().getCode().toUpperCase();
        me.data.title = caps.mapName;
        me.data.description = addAnchors(caps.description);
        me.data.version = caps.currentVersion;
        me.data.image_formats = caps.supportedImageFormatTypes.split(',');
        me.data.query_formats = (caps.supportedQueryFormats ? caps.supportedQueryFormats.split(',') : []);
        me.data.srss = [caps.spatialReference.wkid];
        me.data.services = caps.layers;
        selectLayerByName(layerToSelect);

        me.data.image_format = getPreferedFormat(me.data.image_formats, ['PNG32', 'PNG', 'GIF', 'JPG']);
        me.data.query_format = getPreferedFormat(me.data.query_formats, ['geoJSON', 'JSON']);
        $rootScope.$broadcast('arcgisCapsParsed');
      } catch (e) {
        $rootScope.$broadcast('arcgisCapsParseError', e);
      }
    };

    function selectLayerByName(layerToSelect) {
      if (layerToSelect) {
        me.data.services.forEach(service => {
          service.Layer.forEach(layer => {
            if (layer.name == layerToSelect) {
              layer.checked = true;
            }
            $timeout(() => {
              const id = `#hs-add-layer-${layer.Name}`;
              const el = layoutService.contentWrapper.querySelector(id);
              if (el) {
                el.scrollIntoView();
              }
            }, 1000);
          });
        });
      }
    }

    me.srsChanged = function () {
      $timeout(() => {
        me.data.resample_warning = !ArcgisCapsService.currentProjectionSupported([me.data.srs]);
      }, 0);
    };

    /**
         * @function addLayers
         * @memberOf add-layers-wms.controller
         * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
         * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
         */
    me.addLayers = function (checked) {
      function recurse(layer) {
        if (!checked || layer.checked) {
          if (angular.isUndefined(layer.Layer)) {
            addLayer(
              layer,
              layer.name.replace(/\//g, '&#47;'),
              me.data.path,
              me.data.image_format,
              me.data.query_format,
              getSublayerNames(layer)
            );
          } else {
            const clone = {};
            angular.copy(layer, clone);
            delete clone.Layer;
            addLayer(
              layer,
              layer.name.replace(/\//g, '&#47;'),
              me.data.path,
              me.data.image_format,
              me.data.query_format,
              getSublayerNames(layer)
            );
          }
        }


        angular.forEach(layer.Layer, (sublayer) => {
          recurse(sublayer);
        });
      }
      angular.forEach(me.data.services, (layer) => {
        recurse(layer);
      });
      layoutService.setMainPanel('layermanager');
    };

    function getSublayerNames(service) {
      if (service.layerToSelect) {
        return service.layers.map(l => {
          const tmp = {};
          if (l.name) {
            tmp.name = l.name;
          }
          if (l.layer) {
            tmp.children = getSublayerNames(l);
          }
          return tmp;
        });
      } else {
        return [];
      }
    }

    //TODO all dimension related things need to be refactored into seperate module
    me.getDimensionValues = dimensionService.getDimensionValues;

    me.hasNestedLayers = function (layer) {
      if (angular.isUndefined(layer)) {
        return false;
      }
      return angular.isDefined(layer.layer);
    };


    /**
     * @function addLayer
     * @memberOf hs.addLayersArcgis.addLayerService
     * @param {Object} layer capabilities layer object
     * @param {String} layerName layer name in the map
     * @param {String} path Path name
     * @param {String} imageFormat Format in which to serve image. Usually: image/png
     * @param {String} queryFormat See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
     * @param {OpenLayers.Size} tileSize Tile size in pixels
     * @param {OpenLayers.Projection} crs of the layer
     * @param {Array} subLayers Static sub-layers of the layer
     * @description Add selected layer to map
     */
    function addLayer(layer, layerName, path, imageFormat, queryFormat, tileSize, crs, subLayers) {
      let attributions = [];
      if (layer.Attribution) {
        attributions = [new Attribution({
          html: '<a href="' + layer.Attribution.OnlineResource + '">' + layer.Attribution.Title + '</a>'
        })];
      }
      const layer_class = Tile;
      const dimensions = {};
      angular.forEach(layer.Dimension, (val) => {
        dimensions[val.name] = val;
      });

      const legends = [];
      if (layer.Style && layer.Style[0].LegendURL) {
        legends.push(layer.Style[0].LegendURL[0].OnlineResource);
      }
      const source = new TileArcGISRest({
        url: me.data.getMapUrl,
        attributions,
        //projection: me.data.crs || me.data.srs,
        params: Object.assign({
          LAYERS: `show:${layer.id}`,
          INFO_FORMAT: (layer.queryable ? queryFormat : undefined),
          FORMAT: imageFormat
        }, {}),
        crossOrigin: 'anonymous',
        dimensions: dimensions
      });
      const new_layer = new layer_class({
        title: layerName,
        source,
        //minResolution: layer.minScale,
        //maxResolution: layer.maxScale,
        saveState: true,
        removable: true,
        path
      });
      //OlMap.proxifyLayerLoader(new_layer, me.data.useTiles);
      OlMap.map.addLayer(new_layer);
    }

    /**
     * Add service and its layers to project TODO
     * @memberof hs.addLayersArcgis.service_layer_producer
     * @function addService
     * @param {String} url Service url
     * @param {ol/Group} group Group layer to which add layer to
     */
    me.addService = function (url, group) {
      ArcgisCapsService.requestGetCapabilities(url).then((resp) => {
        const ol_layers = ArcgisCapsService.service2layers(resp);
        ol_layers.forEach(layer => {
          if (angular.isDefined(group)) {
            group.addLayer(layer);
          } else {
            OlMap.map.addLayer(layer);
          }
        });
      });
    };

    return me;
  }];
