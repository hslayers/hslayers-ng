import { TileWMS, WMTS } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import { Style, Icon } from 'ol/style';

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
         * Style VectorLayer
         * @memberof hs.legend.service
         * @function getStyleVectorLayer
         * @returns {style}
         */
        getStyleVectorLayer: function (currentLayer) {
            if (angular.isUndefined(currentLayer)) return;
            var style = new Style();
            style = currentLayer.getStyle();
            var row = {};
            if (typeof style !== "function") {
                var image = style.getImage();
                var stroke = style.getStroke();
                var fill = style.getFill();
                if (image && utils.instOf(image, Icon)) {
                    row.icon = { type: 'icon', src: image.getSrc(), width: '35px', height: '35px' };
                    if (!stroke && !fill) {
                    } else if (stroke && fill) {
                        row.styleStroke = { type: 'stroke', minWidth: '35px', maxWidth: '35px', minHeight: '17px', maxHeight: '17px', borderBottom: "thick solid", borderColor: stroke.getColor() };
                        row.styleFill = { type: 'fill', backgroundColor: fill.getColor(), maxWidth: '35px', minWidth: '35px', minHeight: '35px', border: "3px solid", borderColor: stroke.getColor() };
                    } else {
                        if (fill) {
                            row.styleFill = { type: 'fill', backgroundColor: fill.getColor(), minWidth: '35px', maxWidth: '35px', minHeight: '35px' };

                        } else {
                            row.styleStroke = { type: 'stroke', color: stroke.getColor(), minWidth: '35px', maxWidth: '35px', minHeight: '17px', maxHeight: '17px', borderBottom: "thick solid", borderColor: stroke.getColor() };
                        }
                    }
                } else if (!stroke && !fill) {
                } else if (stroke && fill) {
                    row.styleStroke = { type: 'stroke', color: stroke.getColor(), minWidth: '35px', maxWidth: '35px', minHeight: '17px', maxHeight: '17px', borderBottom: "thick solid", borderColor: stroke.getColor() };
                    row.styleFill = { type: 'fill', backgroundColor: fill.getColor(), minWidth: '35px', maxWidth: '35px', minHeight: '35px', border: "3px solid", borderColor: stroke.getColor() };
                } else {
                    if (fill) {
                        row.styleFill = { type: 'fill', backgroundColor: fill.getColor(), minWidth: '35px', maxWidth: '35px', minHeight: '35px' };
                    } else {
                        row.styleStroke = { type: 'stroke', color: stroke.getColor(), minWidth: '35px', maxWidth: '35px', minHeight: '17px', maxHeight: '17px', borderBottom: "thick solid", borderColor: stroke.getColor() };
                    }
                }
            } else {
            }
            return row;
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
            if (utils.instOf(source, TileWMS)) {
                source_url = source.getUrls()[0]
            } else if (utils.instOf(source, ImageWMS)) {
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
            if (utils.instOf(layer.getSource(), TileWMS) || utils.instOf(layer.getSource(), ImageWMS)) {
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
            } else if (utils.instOf(layer, VectorLayer) && (angular.isUndefined(layer.get('show_in_manager')) || layer.get('show_in_manager') == true)) {
                return {
                    title: layer.get("title"),
                    lyr: layer,
                    type: 'vector',
                    visible: layer.getVisible(),
                    style: me.getStyleVectorLayer(layer)
                };
            } else return undefined;
        }
    })
}]