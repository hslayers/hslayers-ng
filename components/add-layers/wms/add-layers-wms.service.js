import '../../../common/get-capabilities.module';
import '../../utils';
import {Attribution} from 'ol/control';
import {Image as ImageLayer, Tile} from 'ol/layer';
import {ImageWMS} from 'ol/source';
import {TileWMS} from 'ol/source';
import {WMSCapabilities} from 'ol/format';
import {addAnchors} from '../../../common/attribution-utils';
import {getPreferedFormat} from '../../../common/format-utils';

/**
 * @param $rootScope
 * @param HsMapService
 * @param HsWmsGetCapabilitiesService
 * @param HsDimensionService
 * @param $timeout
 * @param HsLayoutService
 * @param HsUtilsService
 * @param HsConfig
 */
export default function (
  $rootScope,
  HsMapService,
  HsWmsGetCapabilitiesService,
  HsDimensionService,
  $timeout,
  HsLayoutService,
  HsUtilsService,
  HsConfig
) {
  'ngInject';
  const me = this;

  this.data = {
    useResampling: false,
    useTiles: true,
    mapProjection: undefined,
    registerMetadata: true,
    tileSize: 512,
  };

  /**
   * @param caps
   * @param response
   */
  function fillProjections(caps, response) {
    if (angular.isDefined(caps.Capability.Layer.CRS)) {
      me.data.srss = caps.Capability.Layer.CRS;
    } else {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(response, 'application/xml');
      const doc = oDOM.documentElement;
      doc.querySelectorAll('Capability>Layer>CRS').forEach((srs) => {
        me.data.srss.push(srs.innerHTML);
      });
    }
  }

  this.capabilitiesReceived = function (response, layerToSelect) {
    try {
      const parser = new WMSCapabilities();
      const caps = parser.read(response);
      me.data.mapProjection = HsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      me.data.title = caps.Service.Title;
      me.data.description = addAnchors(caps.Service.Abstract);
      me.data.version = caps.Version || caps.version;
      me.data.image_formats = caps.Capability.Request.GetMap.Format;
      me.data.query_formats = caps.Capability.Request.GetFeatureInfo
        ? caps.Capability.Request.GetFeatureInfo.Format
        : [];
      me.data.exceptions = caps.Capability.Exception;
      me.data.srss = [];
      fillProjections(caps, response);
      //TODO: WHY?
      if (me.data.srss.indexOf('CRS:84') > -1) {
        me.data.srss.splice(me.data.srss.indexOf('CRS:84'), 1);
      }

      if (
        HsWmsGetCapabilitiesService.currentProjectionSupported(me.data.srss)
      ) {
        me.data.srs =
          me.data.srss.indexOf(
            HsMapService.map.getView().getProjection().getCode()
          ) > -1
            ? HsMapService.map.getView().getProjection().getCode()
            : HsMapService.map
                .getView()
                .getProjection()
                .getCode()
                .toLowerCase();
      } else if (me.data.srss.indexOf('EPSG:4326') > -1) {
        me.data.srs = 'EPSG:4326';
      } else {
        me.data.srs = me.data.srss[0];
      }
      me.srsChanged();
      if (angular.isArray(caps.Capability.Layer)) {
        me.data.services = caps.Capability.Layer;
      } else if (typeof caps.Capability.Layer == 'object') {
        me.data.services = [caps.Capability.Layer];
      }

      selectLayerByName(layerToSelect);

      HsDimensionService.fillDimensionValues(caps.Capability.Layer);

      me.data.getMapUrl = removePortIfProxified(
        caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource
      );
      me.data.image_format = getPreferedFormat(me.data.image_formats, [
        'image/png; mode=8bit',
        'image/png',
        'image/gif',
        'image/jpeg',
      ]);
      me.data.query_format = getPreferedFormat(me.data.query_formats, [
        'application/vnd.esri.wms_featureinfo_xml',
        'application/vnd.ogc.gml',
        'application/vnd.ogc.wms_xml',
        'text/plain',
        'text/html',
      ]);
      $rootScope.$broadcast('wmsCapsParsed');
    } catch (e) {
      $rootScope.$broadcast('wmsCapsParseError', e);
    }
  };

  /**
   * removePortIfProxified
   *
   * @description Removes extra port which is added to the getMap request when
   * GetCapabilities is queried through proxy. <GetMap><DCPType><HTTP><Get>
   * <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/maps"/>
   * then becomes <GetMap><DCPType><HTTP><Get>
   * <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://gis.lesprojekt.cz:8085/cgi-bin/mapserv?map=/home/maps"/>
   * which is wrong.
   * @param {string} url Url for which to remove port but only when proxified
   * with port in proxy path.
   * @private
   * @returns {string} Url without proxy services port added to it.
   */
  function removePortIfProxified(url) {
    if (angular.isUndefined(HsConfig.proxyPrefix)) {
      return url;
    }
    const proxyPort = parseInt(
      HsUtilsService.getPortFromUrl(HsConfig.proxyPrefix)
    );
    if (proxyPort > 0) {
      return url.replace(':' + proxyPort.toString(), '');
    }
    return url;
  }

  /**
   * @param layerToSelect
   */
  function selectLayerByName(layerToSelect) {
    if (layerToSelect) {
      me.data.services.forEach((service) => {
        service.Layer.forEach((layer) => {
          if (layer.Name == layerToSelect) {
            layer.checked = true;
          }
          $timeout(() => {
            const id = `#hs-add-layer-${layer.Name}`;
            const el = HsLayoutService.contentWrapper.querySelector(id);
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
      me.data.resample_warning = !HsWmsGetCapabilitiesService.currentProjectionSupported(
        [me.data.srs]
      );
    }, 0);
  };

  /**
   * @function addLayers
   * @memberOf add-layers-wms.controller
   * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
   * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
   */
  me.addLayers = function (checked) {
    /**
     * @param layer
     */
    function recurse(layer) {
      if (!checked || layer.checked) {
        if (angular.isUndefined(layer.Layer)) {
          addLayer(
            layer,
            layer.Title.replace(/\//g, '&#47;'),
            me.data.path,
            me.data.image_format,
            me.data.query_format,
            me.data.tile_size,
            me.data.srs,
            getSublayerNames(layer)
          );
        } else {
          const clone = {};
          angular.copy(layer, clone);
          delete clone.Layer;
          addLayer(
            layer,
            layer.Title.replace(/\//g, '&#47;'),
            me.data.path,
            me.data.image_format,
            me.data.query_format,
            me.data.tile_size,
            me.data.srs,
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
    HsLayoutService.setMainPanel('layermanager');
  };

  /**
   * @param service
   */
  function getSublayerNames(service) {
    if (service.Layer) {
      return service.Layer.map((l) => {
        const tmp = {};
        if (l.Name) {
          tmp.name = l.Name;
        }
        if (l.Title) {
          tmp.title = l.Title;
        }
        if (l.Layer) {
          tmp.children = getSublayerNames(l);
        }
        return tmp;
      });
    } else {
      return [];
    }
  }

  //TODO all dimension related things need to be refactored into seperate module
  me.getDimensionValues = HsDimensionService.getDimensionValues;

  me.hasNestedLayers = function (layer) {
    if (angular.isUndefined(layer)) {
      return false;
    }
    return angular.isDefined(layer.Layer);
  };

  /**
   * @function addLayer
   * @memberOf add-layers-wms.service
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param {string} path Path name
   * @param {string} imageFormat Format in which to serve image. Usually: image/png
   * @param {string} queryFormat See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param {OpenLayers.Size} tileSize Tile size in pixels
   * @param {OpenLayers.Projection} crs of the layer
   * @param {Array} subLayers Static sub-layers of the layer
   * @description Add selected layer to map
   */
  function addLayer(
    layer,
    layerName,
    path,
    imageFormat,
    queryFormat,
    tileSize,
    crs,
    subLayers
  ) {
    let attributions = [];
    if (layer.Attribution) {
      attributions = [
        new Attribution({
          html:
            '<a href="' +
            layer.Attribution.OnlineResource +
            '">' +
            layer.Attribution.Title +
            '</a>',
        }),
      ];
    }
    let layer_class = Tile;
    let source_class = TileWMS;

    if (!me.data.useTiles) {
      layer_class = ImageLayer;
      source_class = ImageWMS;
    }

    let boundingbox = layer.BoundingBox;
    if (angular.isDefined(crs)) {
      if (angular.isDefined(layer.EX_GeographicBoundingBox)) {
        boundingbox = layer.EX_GeographicBoundingBox;
      }
    } else {
      if (me.data.map_projection != crs) {
        boundingbox = layer.LatLonBoundingBox;
      }
    }
    const dimensions = {};

    angular.forEach(layer.Dimension, (val) => {
      dimensions[val.name] = val;
    });

    const legends = [];
    if (layer.Style && layer.Style[0].LegendURL) {
      legends.push(layer.Style[0].LegendURL[0].OnlineResource);
    }
    let styles = undefined;
    if (layer.styleSelected) {
      styles = layer.styleSelected;
    } else {
      styles =
        layer.Style && layer.Style.length > 0 ? layer.Style[0].Name : 'default';
    }
    const source = new source_class({
      url: me.data.getMapUrl,
      attributions,
      projection: me.data.crs || me.data.srs,
      params: Object.assign(
        {
          LAYERS: layer.Name || layer.Layer[0].Name,
          INFO_FORMAT: layer.queryable ? queryFormat : undefined,
          FORMAT: imageFormat,
          FROMCRS: me.data.srs,
          VERSION: me.data.version,
          STYLES: styles,
        },
        HsDimensionService.paramsFromDimensions(layer)
      ),
      crossOrigin: 'anonymous',
    });
    const new_layer = new layer_class({
      title: layerName,
      source,
      minResolution: layer.MinScaleDenominator,
      maxResolution: layer.MaxScaleDenominator,
      saveState: true,
      removable: true,
      abstract: layer.Abstract,
      MetadataURL: layer.MetadataURL,
      BoundingBox: boundingbox,
      path,
      dimensions: dimensions,
      legends: legends,
      subLayers: subLayers,
    });
    HsMapService.proxifyLayerLoader(new_layer, me.data.useTiles);
    HsMapService.map.addLayer(new_layer);
  }

  /**
   * Add service and its layers to project
   *
   * @memberof hs.addLayersWms.service_layer_producer
   * @function addService
   * @param {string} url Service url
   * @param {ol/Group} group Group layer to which add layer to
   * @param {string} layerName Name of layer to add. If not specified then all layers are added
   */
  me.addService = function (url, group, layerName) {
    HsWmsGetCapabilitiesService.requestGetCapabilities(url).then((resp) => {
      const ol_layers = HsWmsGetCapabilitiesService.service2layers(resp).filter(
        (layer) =>
          angular.isUndefined(layerName) || layer.get('title') == layerName
      );
      ol_layers.forEach((layer) => {
        if (angular.isDefined(group)) {
          group.addLayer(layer);
        } else {
          HsMapService.addLayer(layer, true);
        }
      });
    });
  };

  return me;
}
