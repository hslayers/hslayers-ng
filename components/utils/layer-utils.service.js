import { TileWMS, WMTS } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import { Tile, Image as ImageLayer } from 'ol/layer';
import { Vector as VectorSource, Cluster } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import { isEmpty } from 'ol/extent';

export default ['config', 'hs.utils.service', function (config, utils) {
    var me = this;
    angular.extend(me, {
        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#layerIsZoomable
         * @param {Ol.layer} layer Selected layer
         * @returns {Boolean} True for layer with BoundingBox property, for 
         * WMS layer or for layer, which has source with extent
         * @description Determines if layer have properties needed for Zoom 
         * to layer function.
         */
        layerIsZoomable(layer) {
            if (typeof layer == 'undefined') return false;
            if (layer.get("BoundingBox")) return true;
            if (me.isLayerWMS(layer)) return true;
            if (layer.getSource().getExtent && layer.getSource().getExtent() && !isEmpty(layer.getSource().getExtent())) return true;
            return false;
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#layerIsStyleable
         * @param {Ol.layer} layer Selected layer
         * @returns {Boolean} True for ol.layer.Vector 
         * @description Determines if layer is a Vector layer and therefore 
         * styleable
         */
        layerIsStyleable(layer) {
            if (typeof layer == 'undefined') return false;
            if (utils.instOf(layer, VectorLayer) /*&& layer.getSource().styleAble*/)
                return true;
            return false;
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#isLayerQueryable
         * @param {Ol.layer} layer Selected layer
         * @returns {Boolean} True for ol.layer.Tile and ol.layer.Image with 
         * INFO_FORMAT in params
         * @description Test if layer is queryable (WMS layer with Info format)
         */
        isLayerQueryable(layer) {
            if (utils.instOf(layer, Tile) &&
                (utils.instOf(layer.getSource(), TileWMS)) &&
                layer.getSource().getParams().INFO_FORMAT) return true;
            if (utils.instOf(layer, ImageLayer) &&
                utils.instOf(layer.getSource(), ImageWMS) &&
                layer.getSource().getParams().INFO_FORMAT) return true;
            return false;
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#getLayerTitle
         * @param {Ol.layer} Layer to get layer title
         * @returns {String} Layer title or "Void"
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
         * @name hs.utils.layerUtilsService#isLayerWMS
         * @param {Ol.layer} layer Selected layer
         * @returns {Boolean} True for ol.layer.Tile and ol.layer.Image
         * @description Test if layer is WMS layer
         */
        isLayerWMS(layer) {
            if (utils.instOf(layer, Tile) &&
                (utils.instOf(layer.getSource(), TileWMS))) return true;
            if (utils.instOf(layer, ImageLayer) &&
                utils.instOf(layer.getSource(), ImageWMS)) return true;
            return false;
        },
        // todo

        isLayerWMTS(layer){
            if (utils.instOf(layer, Tile) &&
                    (utils.instOf(layer.getSource(), WMTS))) return true;
        },
        // todo
        getURL(layer){
            let url;
            if (layer.getSource().getUrls) //Multi tile
            url = layer.getSource().getUrls()[0];
            if (layer.getSource().getUrl) //Single tile
            url = layer.getSource().getUrl();
            return url;
        },
         /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#isLayerVectorLayer
         * @param {Ol.layer} layer Selected layer
         * @returns {Boolean} True for Vector layer
         * @description Test if layer is Vector layer
         */
        isLayerVectorLayer(layer) {
            if (utils.instOf(layer, VectorLayer) &&
                (utils.instOf(layer.getSource(), Cluster) || utils.instOf(layer.getSource(), VectorSource))) return true;
            return false;
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#isLayerInManager
         * @param {Ol.layer} layer Layer to check
         * @returns {Boolean} True if show_in_manager attribute is set to true
         * @description Test if layer is shown in layer switcher 
         * (if not some internal hslayers layer like selected feature layer)
         */
        isLayerInManager(layer) {
            return angular.isUndefined(layer.get('show_in_manager'))
                || layer.get('show_in_manager') == true
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#hasLayerTitle
         * @param {Ol.layer} layer Layer to check
         * @returns {Boolean} True if layer is has a title
         * @description Test if layer is has a title
         */
        hasLayerTitle(layer) {
            return angular.isDefined(layer.get('title'))
                && layer.get('title') != ''
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#isLayerEditable
         * @param {Ol.layer} layer Layer to check
         * @returns {Boolean} True if layer has attribute editor amd in it 
         * editable property is set to true or missing
         * @description Test if layers features are editable
         */
        isLayerEditable(layer) {
            if (angular.isUndefined(layer.get('editor'))) return true;
            const editorConfig = layer.get('editor');
            if (angular.isUndefined(editorConfig.editable)) return true;
            return editorConfig.editable
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#isLayerDrawable
         * @param {Ol.layer} layer Layer to check
         * @returns {Boolean} True if layer is drawable vector layer
         * @description Check if layer hasa a VectorSource object, if layer is 
         * not internal for hslayers, if it has title and is shown in layer 
         * switcher
         */
        isLayerDrawable(layer) {
            return utils.instOf(layer, VectorLayer) &&
                layer.getVisible() &&
                me.isLayerInManager(layer) &&
                me.hasLayerTitle(layer) &&
                me.isLayerEditable(layer)
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#layerLoaded
         * @param {Ol.layer} layer Selected layer
         * @returns {Boolean} True loaded / False not (fully) loaded
         * @description Test if layers source is loaded 
         */
        layerLoaded(layer) {
            return layer.getSource().loaded
        },

        /**
         * @ngdoc method
         * @name hs.utils.layerUtilsService#layerInvalid
         * @param {Ol.layer} layer Selected layer
         * @returns {Boolean} True invalid, false valid source
         * @description Test if layers source is validly loaded (!true for invalid)
         */
        layerInvalid(layer) {
            return layer.getSource().error;
        }
    })
}]