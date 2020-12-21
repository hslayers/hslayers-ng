import Static from 'ol/source/ImageStatic';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Icon} from 'ol/style';
import {Image as ImageLayer} from 'ol/layer';
import {ImageWMS} from 'ol/source';
import {TileWMS, XYZ} from 'ol/source';

/**
 * @param HsUtilsService
 */
export default function (HsUtilsService) {
  'ngInject';
  const me = {};
  return angular.extend(me, {
    /**
     * Test if layer is visible and has supported type (conditions for displaying legend)
     *
     * @memberof HsLegendService
     * @function isLegendable
     * @param {object} layer Layer to test
     * @returns {boolean} Return if legend might exists for layer
     */
    isLegendable: function (layer) {
      if (angular.isUndefined(layer) || angular.isUndefined(layer.type)) {
        return false;
      }
      if (
        ['vector', 'wms', 'static'].indexOf(layer.type) > -1 &&
        layer.lyr.getVisible()
      ) {
        return true;
      }
      return false;
    },

    /**
     * Get vector layer feature geometries
     *
     * @memberof HsLegendService
     * @function getVectorFeatureGeometry
     * @param {ol/Layer} currentLayer Layer of interest
     * @returns {Array} Array of simplified lowercase names of geometry types encountered in layer
     */
    getVectorFeatureGeometry: function (currentLayer) {
      if (angular.isUndefined(currentLayer)) {
        return;
      }
      let foundPoint = false;
      let foundLine = false;
      let foundPolygon = false;
      angular.forEach(currentLayer.getSource().getFeatures(), (feature) => {
        if (feature.getGeometry()) {
          const type = feature.getGeometry().getType();
          switch (type) {
            case 'LineString' || 'MultiLineString':
              foundLine = true;
              break;
            case 'Polygon' || 'MultiPolygon':
              foundPolygon = true;
              break;
            case 'Point' || 'MultiPoint':
              foundPoint = true;
              break;
            default:
          }
        }
      });
      const tmp = [];
      if (foundLine) {
        tmp.push('line');
      }
      if (foundPolygon) {
        tmp.push('polygon');
      }
      if (foundPoint) {
        tmp.push('point');
      }
      return tmp;
    },

    /**
     * Get vector layer styles for first 100 features
     *
     * @memberof HsLegendService
     * @function getStyleVectorLayer
     * @param {ol/Layer} currentLayer Layer of interest
     * @returns {Array} Array of serialized unique style descriptions encountered when looping through first 100 features
     */
    getStyleVectorLayer: function (currentLayer) {
      if (angular.isUndefined(currentLayer)) {
        return;
      }
      let styleArray = [];
      const layerStyle = currentLayer.getStyle();
      if (!angular.isFunction(layerStyle)) {
        styleArray.push(layerStyle);
      } else {
        if (currentLayer.getSource().getFeatures().length > 0) {
          let featureStyle = currentLayer
            .getSource()
            .getFeatures()
            .map((feature) => currentLayer.getStyle()(feature));
          if (featureStyle.length > 1000) {
            featureStyle = featureStyle.slice(0, 100);
          }
          if (featureStyle[0].length) {
            featureStyle = [].concat.apply([], featureStyle);
          }
          styleArray = styleArray.concat(featureStyle);
        }
      }
      const filtered = styleArray.filter(
        (style) => angular.isUndefined(style.getText) || !style.getText()
      );
      let serializedStyles = filtered.map((style) => me.serializeStyle(style));
      serializedStyles = HsUtilsService.removeDuplicates(
        serializedStyles,
        'hashcode'
      );
      return serializedStyles;
    },

    /**
     * Serialize styles
     *
     * @memberof HsLegendService
     * @function serializeStyle
     * @param {ol/Style} style Openlayers style
     * @returns {object} Simplified description of style used by template to draw legend
     */
    serializeStyle(style) {
      const styleToSerialize = style[0] ? style[0] : style;
      const image = styleToSerialize.getImage();
      const stroke = styleToSerialize.getStroke();
      const fill = styleToSerialize.getFill();
      const genStyle = me.setUpLegendStyle(fill, stroke, image);
      return genStyle;
    },

    /**
     * Create object of parameters used for creation of svg content for legend using retreived styles
     *
     * @memberof HsLegendService
     * @function setUpLegendStyle
     * @param {ol/style/Fill} fill Fill description
     * @param {ol/style/Stroke} stroke Stroke description
     * @param {ol/style/Image~ImageStyle} image Image description
     * @returns {object} Simplified description of style used by template to draw legend
     */
    setUpLegendStyle(fill, stroke, image) {
      const row = {};
      row.style = {maxWidth: '35px', maxHeight: '35px', marginBottom: '10px'};
      if (image && HsUtilsService.instOf(image, Icon)) {
        row.icon = {type: 'icon', src: image.getSrc()};
      } else if (image && HsUtilsService.instOf(image, Circle)) {
        if (image.getStroke() && image.getFill()) {
          row.customCircle = {
            type: 'circle',
            cx: '17.5px',
            cy: '17.5px',
            r: '15px',
            fill: image.getFill().getColor(),
            stroke: image.getStroke().getColor(),
            strokeWidth: image.getStroke().getWidth(),
          };
        } else if (image.getStroke()) {
          row.customCircle = {
            type: 'circle',
            cx: '17.5px',
            cy: '17.5px',
            r: '15px',
            fill: 'blue',
            stroke: image.getStroke().getColor(),
            strokeWidth: image.getStroke().getWidth(),
          };
        }
      } else {
        row.defaultCircle = {
          fill: 'blue',
          cx: '17.5px',
          cy: '17.5px',
          r: '15px',
        };
      }
      if (!stroke && !fill) {
        row.defaultLine = {type: 'line', stroke: 'blue', strokeWidth: '1'};
        row.defaultPolygon = {
          type: 'polygon',
          fill: 'blue',
          stroke: 'purple',
          strokeWidth: '1',
        };
      } else if (stroke && fill) {
        row.fullPolygon = {
          type: 'polygon',
          stroke: stroke.getColor(),
          strokeWidth: stroke.getWidth() / 2,
          fill: fill.getColor(),
        };
        row.line = {
          type: 'line',
          stroke: stroke.getColor(),
          strokeWidth: stroke.getWidth() / 2,
        };
      } else {
        if (fill) {
          row.polygon = {type: 'polygon', fill: fill.getColor()};
          row.defaultLine = {type: 'line', stroke: 'blue', strokeWidth: '1'};
        } else {
          row.line = {
            type: 'line',
            stroke: stroke.getColor(),
            strokeWidth: stroke.getWidth() / 2,
          };
          row.defaultPolygon = {
            type: 'polygon',
            fill: 'blue',
            stroke: 'purple',
            strokeWidth: '1',
          };
        }
      }
      row.hashcode = angular.toJson(row).hashCode();
      return row;
    },

    /**
     * Generate url for GetLegendGraphic request of WMS service for selected layer
     *
     * @memberof HsLegendService
     * @function getLegendUrl
     * @param {ol.source.Source} source Source of wms layer
     * @param {string} layer_name Name of layer for which legend is requested
     * @param {ol/Layer} layer Layer to get legend for
     * @returns {string} Url of the legend graphics
     */
    getLegendUrl: function (source, layer_name, layer) {
      let source_url = '';
      if (HsUtilsService.instOf(source, TileWMS)) {
        source_url = source.getUrls()[0];
      } else if (HsUtilsService.instOf(source, ImageWMS)) {
        source_url = source.getUrl();
      } else {
        return '';
      }
      if (source_url.indexOf('proxy4ows') > -1) {
        const params = HsUtilsService.getParamsFromUrl(source_url);
        source_url = params.OWSURL;
      }
      let version = '1.3.0';
      if (source.getParams().VERSION) {
        version = source.getParams().VERSION;
      }
      source_url +=
        (source_url.indexOf('?') > 0 ? '' : '?') +
        '&version=' +
        version +
        '&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=' +
        layer_name +
        '&format=image%2Fpng';
      if (
        angular.isUndefined(layer.get('enableProxy')) ||
        layer.get('enableProxy') == true
      ) {
        source_url = HsUtilsService.proxify(source_url, false);
      }
      return source_url;
    },

    /**
     * (PRIVATE) Generate url for GetLegendGraphic request of WMS service for selected layer
     *
     * @memberof HsLegendService
     * @function getLegendUrl
     * @returns {object} Description of layer to be used for creating the legend. It contains type of layer, sublayer legends, title, visibility etc.
     * @param {ol/Layer} layer Openlayers layer
     */
    getLayerLegendDescriptor: function (layer) {
      if (layer.get('base')) {
        return;
      }
      if (
        HsUtilsService.instOf(layer.getSource(), TileWMS) ||
        HsUtilsService.instOf(layer.getSource(), ImageWMS)
      ) {
        const sourceParamLayers = layer.getSource().getParams().LAYERS;
        if (angular.isDefined(sourceParamLayers)) {
          const subLayerLegends = sourceParamLayers.split(',');
          for (let i = 0; i < subLayerLegends.length; i++) {
            subLayerLegends[i] = me.getLegendUrl(
              layer.getSource(),
              subLayerLegends[i],
              layer
            );
          }
          return {
            title: layer.get('title'),
            lyr: layer,
            type: 'wms',
            subLayerLegends: subLayerLegends,
            visible: layer.getVisible(),
          };
        } else if (
          HsUtilsService.instOf(layer, VectorLayer) &&
          (angular.isUndefined(layer.get('show_in_manager')) ||
            layer.get('show_in_manager') == true)
        ) {
          return {
            title: layer.get('title'),
            lyr: layer,
            type: 'vector',
            visible: layer.getVisible(),
          };
        } else if (
          HsUtilsService.instOf(layer, ImageLayer) &&
          HsUtilsService.instOf(layer.getSource(), Static)
        ) {
          return {
            title: layer.get('title'),
            lyr: layer,
            type: 'static',
            visible: layer.getVisible(),
          };
        } else if (HsUtilsService.instOf(layer.getSource(), XYZ)) {
          return {
            title: layer.get('title'),
            lyr: layer,
            type: 'static',
            visible: layer.getVisible(),
          };
        } else {
          return undefined;
        }
      }
    },
  });
}
