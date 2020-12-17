import VectorLayer from 'ol/layer/Vector';
import {Cluster, Vector as VectorSource} from 'ol/source';
import {Image as ImageLayer, Tile} from 'ol/layer';
import {ImageWMS} from 'ol/source';
import {TileWMS, WMTS} from 'ol/source';
import {isEmpty} from 'ol/extent';

/**
 * @param HsUtilsService
 */
export default function (HsUtilsService) {
  'ngInject';
  const me = this;
  return angular.extend(me, {
    /**
     * @ngdoc method
     * @name HsLayerUtilsService#layerIsZoomable
     * @param {Ol.layer} layer Selected layer
     * @returns {boolean} True for layer with BoundingBox property, for
     * WMS layer or for layer, which has source with extent
     * @description Determines if layer have properties needed for Zoom
     * to layer function.
     */
    layerIsZoomable(layer) {
      if (typeof layer == 'undefined') {
        return false;
      }
      if (layer.get('BoundingBox')) {
        return true;
      }
      if (me.isLayerWMS(layer)) {
        return true;
      }
      if (
        layer.getSource().getExtent &&
        layer.getSource().getExtent() &&
        !isEmpty(layer.getSource().getExtent())
      ) {
        return true;
      }
      return false;
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#layerIsStyleable
     * @param {Ol.layer} layer Selected layer
     * @returns {boolean} True for ol.layer.Vector
     * @description Determines if layer is a Vector layer and therefore
     * styleable
     */
    layerIsStyleable(layer) {
      if (typeof layer == 'undefined') {
        return false;
      }
      if (
        HsUtilsService.instOf(
          layer,
          VectorLayer
        ) /*&& layer.getSource().styleAble*/
      ) {
        return true;
      }
      return false;
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#isLayerQueryable
     * @param {Ol.layer} layer Selected layer
     * @returns {boolean} True for ol.layer.Tile and ol.layer.Image with
     * INFO_FORMAT in params
     * @description Test if layer is queryable (WMS layer with Info format)
     */
    isLayerQueryable(layer) {
      if (
        HsUtilsService.instOf(layer, Tile) &&
        HsUtilsService.instOf(layer.getSource(), TileWMS) &&
        layer.getSource().getParams().INFO_FORMAT
      ) {
        return true;
      }
      if (
        HsUtilsService.instOf(layer, ImageLayer) &&
        HsUtilsService.instOf(layer.getSource(), ImageWMS) &&
        layer.getSource().getParams().INFO_FORMAT
      ) {
        return true;
      }
      return false;
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#getLayerTitle
     * @param {Ol.layer} layer to get layer title
     * @returns {string} Layer title or "Void"
     * @description Get title of selected layer
     */
    getLayerTitle(layer) {
      if (angular.isDefined(layer.get('title'))) {
        return layer.get('title').replace(/&#47;/g, '/');
      } else {
        return 'Void';
      }
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#isLayerWMS
     * @param {Ol.layer} layer Selected layer
     * @returns {boolean} True for ol.layer.Tile and ol.layer.Image
     * @description Test if layer is WMS layer
     */
    isLayerWMS(layer) {
      if (
        HsUtilsService.instOf(layer, Tile) &&
        HsUtilsService.instOf(layer.getSource(), TileWMS)
      ) {
        return true;
      }
      if (
        HsUtilsService.instOf(layer, ImageLayer) &&
        HsUtilsService.instOf(layer.getSource(), ImageWMS)
      ) {
        return true;
      }
      return false;
    },
    // todo

    isLayerWMTS(layer) {
      if (
        HsUtilsService.instOf(layer, Tile) &&
        HsUtilsService.instOf(layer.getSource(), WMTS)
      ) {
        return true;
      }
    },
    // todo
    getURL(layer) {
      let url;
      if (layer.getSource().getUrls) {
        //Multi tile
        url = layer.getSource().getUrls();
        if (url) { //in case WMTS source has yet not been set
          url = url[0];
        }
      }
      if (layer.getSource().getUrl) {
        //Single tile
        url = layer.getSource().getUrl();
      }
      return url;
    },
    /**
     * @ngdoc method
     * @name HsLayerUtilsService#isLayerVectorLayer
     * @param {Ol.layer} layer Selected layer
     * @returns {boolean} True for Vector layer
     * @description Test if layer is Vector layer
     */
    isLayerVectorLayer(layer) {
      if (
        HsUtilsService.instOf(layer, VectorLayer) &&
        (HsUtilsService.instOf(layer.getSource(), Cluster) ||
          HsUtilsService.instOf(layer.getSource(), VectorSource))
      ) {
        return true;
      }
      return false;
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#isLayerInManager
     * @param {Ol.layer} layer Layer to check
     * @returns {boolean} True if show_in_manager attribute is set to true
     * @description Test if layer is shown in layer switcher
     * (if not some internal hslayers layer like selected feature layer)
     */
    isLayerInManager(layer) {
      return (
        angular.isUndefined(layer.get('show_in_manager')) ||
        layer.get('show_in_manager') == true
      );
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#hasLayerTitle
     * @param {Ol.layer} layer Layer to check
     * @returns {boolean} True if layer is has a title
     * @description Test if layer is has a title
     */
    hasLayerTitle(layer) {
      return angular.isDefined(layer.get('title')) && layer.get('title') != '';
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#isLayerEditable
     * @param {Ol.layer} layer Layer to check
     * @returns {boolean} True if layer has attribute editor amd in it
     * editable property is set to true or missing
     * @description Test if layers features are editable
     */
    isLayerEditable(layer) {
      if (angular.isUndefined(layer.get('editor'))) {
        return true;
      }
      const editorConfig = layer.get('editor');
      if (angular.isUndefined(editorConfig.editable)) {
        return true;
      }
      return editorConfig.editable;
    },

    getLayerName(layer) {
      if (
        angular.isUndefined(layer) ||
        (angular.isDefined(layer.get('show_in_manager')) &&
          layer.get('show_in_manager') === false)
      ) {
        return '';
      }
      const layerName = layer.get('title') || layer.get('name');
      return layerName;
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#isLayerDrawable
     * @param {Ol.layer} layer Layer to check
     * @returns {boolean} True if layer is drawable vector layer
     * @description Checks if layer has a VectorSource object, if layer is
     * not internal for hslayers, if it has title and is shown in layer
     * switcher
     */
    isLayerDrawable(layer) {
      return (
        HsUtilsService.instOf(layer, VectorLayer) &&
        layer.getVisible() &&
        me.isLayerInManager(layer) &&
        me.hasLayerTitle(layer) &&
        me.isLayerEditable(layer)
      );
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#isLayerClustered
     * @param {Ol.layer} layer Layer to check
     * @returns {boolean} True if layer is clustered, false otherwise
     * @description Checks if layer's source has its own source
     */
    isLayerClustered(layer) {
      return me.isLayerVectorLayer(layer) && layer.get('cluster')
        ? true
        : false;
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#layerLoaded
     * @param {Ol.layer} layer Selected layer
     * @returns {boolean} True loaded / False not (fully) loaded
     * @description Test if layers source is loaded
     */
    layerLoaded(layer) {
      return layer.getSource().loaded;
    },

    /**
     * @ngdoc method
     * @name HsLayerUtilsService#layerInvalid
     * @param {Ol.layer} layer Selected layer
     * @returns {boolean} True invalid, false valid source
     * @description Test if layers source is validly loaded (!true for invalid)
     */
    layerInvalid(layer) {
      return layer.getSource().error;
    },
  });
}
