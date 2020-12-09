import VectorLayer from 'ol/layer/Vector';
import WMTS from 'ol/source/WMTS';
import {Circle, Icon, Style} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {ImageArcGISRest, ImageStatic, TileArcGISRest, TileWMS} from 'ol/source';
import {Image as ImageLayer, Tile} from 'ol/layer';
import {ImageWMS, XYZ} from 'ol/source';

/**
 * @param HsMapService
 * @param HsUtilsService
 * @param $window
 * @param HsLayoutService
 * @param $log
 * @param $document
 */
export default function (
  HsMapService,
  HsUtilsService,
  $window,
  HsLayoutService,
  $log,
  $document
) {
  'ngInject';
  const me = {
    /**
     * Create Json object which stores information about composition, user, map state and map layers (including layer data)
     *
     * @memberof HsSaveMapService
     * @function map2json
     * @param {Ol.map} map Selected map object
     * @param {object} compoData Composition general metadata
     * @param {object} userData Metadata about user
     * @param {object} statusData Metadata about permissions
     * @returns {object} JSON object with all required map composition metadata
     */
    map2json: function (map, compoData, userData, statusData) {
      const groups = {};
      angular.forEach(statusData.groups, (g) => {
        if (g.r || g.w) {
          groups[g.roleName] = (g.r ? 'r' : '') + (g.w ? 'w' : '');
        }
      });
      if (angular.isUndefined(groups.guest)) {
        groups.guest = 'r';
      }
      const json = {
        abstract: compoData.abstract,
        title: compoData.title,
        keywords: compoData.keywords,
        extent: compoData.bbox,
        user: {
          address: userData.address,
          city: userData.city,
          country: userData.country,
          email: userData.email || 'none@none',
          name: userData.name,
          organization: userData.organization,
          phone: userData.phone,
          position: userData.position,
          postalcode: userData.postalcode,
          state: userData.state,
        },
        groups: groups,
      };

      // Map properties
      json.scale = map.getView().getProjection().getMetersPerUnit();
      json.projection = map.getView().getProjection().getCode().toLowerCase();
      const center = map.getView().getCenter();
      if (center) {
        json.center = [center[0], center[1]];
      }
      json.units = map.getView().getProjection().getUnits();

      if (map.maxExtent) {
        json.maxExtent = {};
        json.maxExtent.left = map.maxExtent.left;
        json.maxExtent.bottom = map.maxExtent.bottom;
        json.maxExtent.right = map.maxExtent.right;
        json.maxExtent.top = map.maxExtent.top;
      }

      //json.minResolution = map.minResolution;
      //json.maxResolution = map.maxResolution;
      //json.numZoomLevels = map.numZoomLevels;

      //json.resolutions = map.resolutions;
      //json.scales = map.scales;
      //json.sphericalMercator = map.sphericalMercator;

      // Layers properties
      let layers = map.getLayers().getArray();
      layers = layers.filter(
        (l) =>
          angular.isUndefined(l.get('show_in_manager')) ||
          l.get('show_in_manager')
      );
      json.layers = me.layers2json(layers, compoData.layers);
      json.current_base_layer = me.getCurrentBaseLayer(map);
      return json;
    },
    /**
     * Returns object about current selected base layer
     *
     * @memberof HsSaveMapService
     * @function getCurrentBaseLayer
     * @param {Ol.map} map Selected map object
     * @returns {object} Returns object with current current selected base layers title as attribute
     */
    getCurrentBaseLayer: function (map) {
      let current_base_layer = null;
      angular.forEach(map.getLayers().getArray(), (lyr) => {
        if (
          (angular.isUndefined(lyr.get('show_in_manager')) ||
            lyr.get('show_in_manager') == true) &&
          lyr.get('base') == true &&
          lyr.getVisible()
        ) {
          current_base_layer = {
            title: lyr.get('title'),
          };
        }
      });
      return current_base_layer;
    },

    /**
     * Converts map layers into a JSON object. If $scope is defined, stores only layers checked in form
     * Uses layer2json().
     *
     * @memberof HsSaveMapService
     * @function layer2json
     * @param {Array} layers All map layers
     * @param {Array} tickedLayers List of layers and if they have been ticked
     * @returns {Array} JSON object representing the layers
     */
    layers2json: function (layers, tickedLayers) {
      const json = [];
      layers.forEach((lyr) => {
        if (angular.isDefined(tickedLayers)) {
          //From form
          angular.forEach(tickedLayers, (list_item) => {
            if (list_item.layer == lyr && list_item.checked) {
              const l = me.layer2json(lyr);
              if (l) {
                json.push(l);
              }
            }
          });
        } else {
          //From unloading
          const l = me.layer2json(lyr);
          if (l) {
            json.push(l);
          }
        }
      });

      return json;
    },

    /**
     * Converts map layer from Layer object to text in JSON notation.
     *
     * Syntactic sugar for layer2json() UNUSED?
     *
     * @memberof HsSaveMapService
     * @function layer2string
     * @param {object} layer Layer to be converted
     * @param {boolean} pretty Whether to use pretty notation
     * @returns {string} Text in JSON notation representing the layer
     */
    layer2string: function (layer, pretty) {
      const json = me.layer2json(layer);
      const text = angular.toJson(json, pretty);
      return text;
    },

    /**
     * Convert layer style object into JSON object, partial function of layer2style (saves Fill color, Stroke color/width, Image fill, stroke, radius, src and type)
     *
     * @memberof HsSaveMapService
     * @function serializeStyle
     * @param {ol.style.Style} s Style to convert
     * @returns {object} Converted JSON object for style
     */
    serializeStyle: function (s) {
      const o = {};
      if (angular.isDefined(s.getFill()) && s.getFill() !== null) {
        o.fill = s.getFill().getColor();
      }
      if (angular.isDefined(s.getStroke()) && s.getStroke() !== null) {
        o.stroke = {
          color: s.getStroke().getColor(),
          width: s.getStroke().getWidth(),
        };
      }
      if (angular.isDefined(s.getImage()) && s.getImage() !== null) {
        const style_img = s.getImage();
        const ima = {};
        if (
          angular.isDefined(style_img.getFill) &&
          angular.isDefined(style_img.getFill()) &&
          style_img.getFill() !== null
        ) {
          ima.fill = style_img.getFill().getColor();
        }

        if (
          angular.isDefined(style_img.getStroke) &&
          angular.isDefined(style_img.getStroke()) &&
          style_img.getStroke() !== null
        ) {
          ima.stroke = {
            color: style_img.getStroke().getColor(),
            width: style_img.getStroke().getWidth(),
          };
        }

        if (angular.isDefined(style_img.getRadius)) {
          ima.radius = style_img.getRadius();
        }

        if (
          angular.isFunction(style_img.getSrc) &&
          angular.isString(style_img.getSrc())
        ) {
          ima.src = HsUtilsService.proxify(style_img.getSrc());
        } else if (
          angular.isFunction(style_img.getImage) &&
          style_img.getImage() !== null
        ) {
          if (angular.isDefined(style_img.getImage().src)) {
            ima.src = style_img.getImage().src;
          }
        }

        if (HsUtilsService.instOf(style_img, Circle)) {
          ima.type = 'circle';
        }

        if (HsUtilsService.instOf(style_img, Icon)) {
          ima.type = 'icon';
        }

        o.image = ima;
      }
      return o;
    },

    /**
     * Converts map layer into a JSON object (only for ol.layer.Layer)
     * Layer properties covered:  (CLASS_NAME), name, url, params,
     *                            group, displayInLayerSwitcher, *visibility, *opacity
     *                            attribution, transitionEffect,
     *                             isBaseLayer, minResolution,
     *                            maxResolution, minScale, maxScale, metadata,
     *                            abstract, opacity, singleTile, removable,
     *                            queryable, legend, projections,
     *                            wmsMinScale, wmsMaxScale
     *
     * The layer index is not covered, as we assume
     * that it is corresponding to the layers order.
     *
     * @memberof HsSaveMapService
     * @function layer2json
     * @param {object} layer Map layer that should be converted
     * @returns {object} JSON object representing the layer
     */
    layer2json: function (layer) {
      const json = {
        metadata: {},
      };

      /*
            Commented out because we cant reliably use instanceof.
            utils.instOf is also not possible, because Layer is a base type

            if (!layer instanceof Layer) {
                return;
            }
            */

      // Common stuff

      // type
      //json.className = layer.CLASS_NAME;
      //json.origClassName = layer.CLASS_NAME; // the original type

      // options
      json.visibility = layer.getVisible();
      json.opacity = layer.getOpacity();
      json.title = layer.get('title');
      if (angular.isUndefined(layer.get('title'))) {
        $log.warn('Layer title undefined', layer);
        // debugger;
      }
      //json.index = layer.map.getLayerIndex(layer);
      json.path = layer.get('path');

      if (layer.getExtent()) {
        const ex = layer.getExtent();
        json.maxExtent = {
          left: ex[0],
          bottom: ex[3],
          right: ex[2],
          top: ex[1],
        };
      }

      // HTTPRequest
      if (
        HsUtilsService.instOf(layer, Tile) ||
        HsUtilsService.instOf(layer, ImageLayer)
      ) {
        const src = layer.getSource();
        if (layer.getMaxResolution() !== null) {
          json.maxResolution = layer.getMaxResolution();
        }
        if (layer.getMinResolution() !== null) {
          json.minResolution = layer.getMinResolution();
        }
        if (layer.get('minScale') !== null) {
          json.wmsMinScale = layer.get('minScale');
        }
        if (layer.get('maxScale') !== null) {
          json.wmsMaxScale = layer.get('maxScale');
        }
        json.displayInLayerSwitcher = layer.get('show_in_manager');
        if (layer.get('dimensions')) {
          json.dimensions = layer.get('dimensions');
        }
        if (HsUtilsService.instOf(src, XYZ)) {
          json.className = 'XYZ';
        }
        if (
          HsUtilsService.instOf(src, ImageArcGISRest) ||
          HsUtilsService.instOf(src, TileArcGISRest)
        ) {
          json.className = 'ArcGISRest';
          json.singleTile = HsUtilsService.instOf(src, ImageArcGISRest);
        }
        if (HsUtilsService.instOf(src, ImageStatic)) {
          json.className = 'StaticImage';
          json.extent = src.getImageExtent();
        }
        if (
          HsUtilsService.instOf(src, ImageWMS) ||
          HsUtilsService.instOf(src, TileWMS)
        ) {
          json.className = 'HSLayers.Layer.WMS';
          json.singleTile = HsUtilsService.instOf(src, ImageWMS);
          if (layer.get('legends')) {
            json.legends = [];
            const legends = layer.get('legends');
            for (let i = 0; i < legends.length; i++) {
              json.legends.push(encodeURIComponent(legends[i]));
            }
          }
          if (src.getProjection()) {
            json.projection = src.getProjection().getCode().toLowerCase();
          }
          json.params = src.getParams();
          json.ratio = src.get('ratio') || src.ratio_;
          json.subLayers = layer.get('subLayers');
          json.metadata.styles = src.get('styles');
        }
        if (src.getUrl) {
          json.url = encodeURIComponent(src.getUrl());
        }
        if (src.getUrls) {
          json.url = encodeURIComponent(src.getUrls()[0]);
        }
        if (src.attributions_) {
          json.attributions = encodeURIComponent(src.attributions_);
        }
        if (HsUtilsService.instOf(src, WMTS)) {
          json.className = 'HSLayers.Layer.WMTS';
          json.matrixSet = src.getMatrixSet();
          json.layer = src.getLayer();
          json.format = src.getFormat();
          json.extent = layer.getExtent();
          json.info_format = layer.get('info_format');
        }
      }

      // Vector
      if (HsUtilsService.instOf(layer, VectorLayer)) {
        const src = layer.getSource();
        json.className = 'OpenLayers.Layer.Vector';
        const definition = layer.get('definition');
        if (
          angular.isDefined(definition) &&
          angular.isDefined(definition.url)
        ) {
          json.protocol = {
            url: encodeURIComponent(definition.url),
            format: definition.format,
          };
          delete json.features;
        } else {
          try {
            json.features = me.serializeFeatures(src.getFeatures());
          } catch (ex) {
            //Do nothing
          }
        }
        if (angular.isDefined(src.defOptions)) {
          json.defOptions = src.defOptions;
        }
        json.maxResolution = layer.getMaxResolution();
        json.minResolution = layer.getMinResolution();
        json.projection = 'epsg:4326';
        if (HsUtilsService.instOf(layer.getStyle(), Style)) {
          json.style = me.serializeStyle(layer.getStyle());
        }
      }
      console.log(json);
      return json;
    },

    /**
     * Convert feature array to GeoJSON string
     *
     * @memberof HsSaveMapService
     * @function serializeFeatures
     * @param {Array} features Array of features
     * @returns {string} GeoJSON string
     */
    serializeFeatures: function (features) {
      const f = new GeoJSON();
      return f.writeFeatures(features, {
        dataProjection: 'EPSG:4326',
        featureProjection: HsMapService.map.getView().getProjection().getCode(),
      });
    },

    /**
     * Generate random Uuid
     *
     * @memberof HsSaveMapService
     * @function generateUuid
     * @returns {string} Random Uuid in string format
     */
    generateUuid: HsUtilsService.generateUuid,

    /**
     * Create thumbnail of map view and save it into selected element
     *
     * @memberof HsSaveMapService
     * @function generateThumbnail
     * @param {$element} $element Selected element
     * @param {object} localThis Context to be passed to postcompose event handler
     * @param {boolean} newRender Force new render?
     */
    generateThumbnail: function ($element, localThis, newRender) {
      /**
       * @param event
       */
      function rendered(event) {
        const canvas = HsMapService.getCanvas();
        const canvas2 = $document[0].createElement('canvas');
        const width = 256,
          height = 256;
        canvas2.style.width = width + 'px';
        canvas2.style.height = height + 'px';
        canvas2.width = width;
        canvas2.height = height;
        const ctx2 = canvas2.getContext('2d');
        ctx2.drawImage(
          canvas,
          canvas.width / 2 - height / 2,
          canvas.height / 2 - width / 2,
          width,
          height,
          0,
          0,
          width,
          height
        );
        try {
          $element.setAttribute('src', canvas2.toDataURL('image/png'));
          this.thumbnail = canvas2.toDataURL('image/jpeg', 0.8);
        } catch (e) {
          $log.warn(e);
          $element.setAttribute('src', require('./notAvailable.png'));
        }
        $element.style.width = width + 'px';
        $element.style.height = height + 'px';
      }
      if (
        HsLayoutService.mainpanel == 'save-map' ||
        HsLayoutService.mainpanel == 'permalink' ||
        HsLayoutService.mainpanel == 'statusCreator'
      ) {
        if ($element === null) {
          return;
        }
        $element.setAttribute('crossOrigin', 'Anonymous');

        HsMapService.map.once('postcompose', rendered, localThis);
        if (newRender) {
          HsMapService.map.renderSync();
        } else {
          rendered();
        }
      }
    },
  };

  $window.addEventListener('beforeunload', (event) => {
    const data = {};
    const layers = [];
    angular.forEach(HsMapService.map.getLayers(), (layer) => {
      if (layer.get('saveState')) {
        const lyr = me.layer2json(layer);
        layers.push(lyr);
      }
    });
    data.layers = layers;
    localStorage.setItem('hs_layers', angular.toJson(data));
  });
  return me;
}
