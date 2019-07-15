import { TileWMS, WMTS } from 'ol/source';
import {ImageWMS, ImageArcGISRest} from 'ol/source';

export default ['hs.utils.service', function (utils) {
    var me = {};
    return angular.extend(me, {

        /** 
         * Test if layer is visible and has supported type (conditions for displaying legend)
         * @memberof hs.legend.service
         * @function isLegendable
         * @param {object} layer Layer to test
         * @returns {Boolean}
         */
        isLegendable: function (layer) {
            if (['vector', 'wms'].indexOf(layer.type) > -1 && layer.lyr.getVisible()) return true;
            return false;
        },

        /**
         * Generate url for GetLegendGraphic request of WMS service for selected layer
         * @memberof hs.legend.service
         * @function getLegendUrl
         * @param {ol.source.Source} source Source of wms layer
         * @param {string} layer_name Name of layer for which legend is requested
         */
        getLegendUrl: function (source, layer_name) {
            var source_url = "";
            if (source instanceof TileWMS) {
                source_url = source.getUrls()[0]
            } else if (source instanceof ImageWMS) {
                source_url = source.getUrl()
            } else {
                return ""
            }
            if (source_url.indexOf('proxy4ows') > -1) {
                var params = utils.getParamsFromUrl(source_url);
                source_url = params.OWSURL;
            }
            var version = '1.3.0';
            if (source.getParams().VERSION) version = source.getParams().VERSION;
            source_url += (source_url.indexOf('?') > 0 ? '' : '?') + "&version=" + version + "&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=" + layer_name + "&format=image%2Fpng";
            source_url = utils.proxify(source_url, false);
            return source_url;
        },

        /**
         * (PRIVATE) Generate url for GetLegendGraphic request of WMS service for selected layer
         * @memberof hs.legend.service
         * @function getLegendUrl
         * @param {string} source_url Url of service
         * @param {string} layer_name Name of layer for which legend is requested
         */
        getLayerLegendDescriptor: function (layer) {
            if (layer.getSource() instanceof TileWMS || layer.getSource() instanceof ImageWMS) {
                var subLayerLegends = layer.getSource().getParams().LAYERS.split(",");
                for (var i = 0; i < subLayerLegends.length; i++) {
                    subLayerLegends[i] = me.getLegendUrl(layer.getSource(), subLayerLegends[i]);
                }
                return {
                    title: layer.get("title"),
                    lyr: layer,
                    type: 'wms',
                    subLayerLegends: subLayerLegends,
                    visible: layer.getVisible()
                };
            } else if (layer.getSource().legend_categories) {
                return {
                    title: layer.get("title"),
                    lyr: layer,
                    type: 'vector',
                    visible: layer.getVisible()
                };
            } else return undefined;
        }
    })
}]