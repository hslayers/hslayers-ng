import {TileWMS, WMTS} from 'ol/source';
import {ImageWMS, ImageArcGISRest} from 'ol/source';
import {Tile, Image as ImageLayer} from 'ol/layer';
import {Vector} from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import {isEmpty} from 'ol/extent';

export default ['config', function (config) {
    var me = this;

    /**
     * @ngdoc method
     * @name hs.utils.layerUtilsService#layerIsZoomable
     * @param {Ol.layer} layer Selected layer
     * @returns {Boolean} True for layer with BoundingBox property, for WMS layer or for layer, which has source with extent
     * @description Determines if layer have properties needed for Zoom to layer function.
     */
    this.layerIsZoomable = function (layer) {
        if (typeof layer == 'undefined') return false;
        if (layer.get("BoundingBox")) return true;
        if (me.isLayerWMS(layer)) return true;
        if (layer.getSource().getExtent && layer.getSource().getExtent() && !isEmpty(layer.getSource().getExtent())) return true;
        return false;
    }

    /**
     * @ngdoc method
     * @name hs.utils.layerUtilsService#layerIsStyleable
     * @param {Ol.layer} layer Selected layer
     * @returns {Boolean} True for ol.layer.Vector 
     * @description Determines if layer is a Vector layer and therefore styleable
     */
    this.layerIsStyleable = function (layer) {
        if (typeof layer == 'undefined') return false;
        if (layer instanceof VectorLayer /*&& layer.getSource().styleAble*/) return true;
        return false;
    }

    /**
     * @ngdoc method
     * @name hs.utils.layerUtilsService#isLayerQueryable
     * @param {Ol.layer} layer Selected layer
     * @returns {Boolean} True for ol.layer.Tile and ol.layer.Image with INFO_FORMAT in params
     * @description Test if layer is queryable (WMS layer with Info format)
     */
    this.isLayerQueryable = function (layer) {
        if (layer instanceof Tile &&
            (layer.getSource() instanceof TileWMS) &&
            layer.getSource().getParams().INFO_FORMAT) return true;
        if (layer instanceof ImageLayer &&
            layer.getSource() instanceof ImageWMS &&
            layer.getSource().getParams().INFO_FORMAT) return true;
        return false;
    }
    /**
     * @ngdoc method
     * @name hs.utils.layerUtilsService#isLayerWMS
     * @param {Ol.layer} layer Selected layer
     * @returns {Boolean} True for ol.layer.Tile and ol.layer.Image
     * @description Test if layer is WMS layer
     */
    this.isLayerWMS = function (layer) {
        if (layer instanceof Tile &&
            (layer.getSource() instanceof TileWMS)) return true;
        if (layer instanceof ImageLayer &&
            layer.getSource() instanceof ImageWMS) return true;
        return false;
    }

    /**
     * @ngdoc method
     * @name hs.utils.layerUtilsService#layerLoaded
     * @param {Ol.layer} layer Selected layer
     * @returns {Boolean} True loaded / False not (fully) loaded
     * @description Test if layers source is loaded 
     */
    this.layerLoaded = function (layer) {
        return layer.getSource().loaded
    }

    /**
     * @ngdoc method
     * @name hs.utils.layerUtilsService#layerInvalid
     * @param {Ol.layer} layer Selected layer
     * @returns {Boolean} True invalid, false valid source
     * @description Test if layers source is validly loaded (!true for invalid)
     */
    this.layerInvalid = function (layer) {
        return layer.getSource().error;
    }


}]