import { TileWMS, WMTS } from 'ol/source';
import { ImageWMS, ImageArcGISRest } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import { Icon, Circle } from 'ol/style';

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
        * Get vector layer feature geometries
        * @memberof hs.legend.service
        * @function getVectorFeatureGeometry
        * @returns {boolean}
        */
        getVectorFeatureGeometry: function (currentLayer) {
            if (angular.isUndefined(currentLayer)) return;
            var foundPoint = false;
            var foundLine = false;
            var foundPolygon = false;
            angular.forEach(currentLayer.getSource().getFeatures(), function (feature) {
                if (feature.getGeometry()) {
                    var type = feature.getGeometry().getType();
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
                    }
                }
            });
            var tmp = [];
            if (foundLine) tmp.push('line');
            if (foundPolygon) tmp.push('polygon');
            if (foundPoint) tmp.push('point');
            return tmp;
        },
        /** 
         * Get vector layer styles
         * @memberof hs.legend.service
         * @function getStyleVectorLayer
         * @returns {style}
         */
        getStyleVectorLayer: function (currentLayer) {
            if (angular.isUndefined(currentLayer)) return;
            var styleArray = [];
            var layerStyle = currentLayer.getStyle();
            if (typeof layerStyle !== "function") {
                styleArray.push(layerStyle);
            } else {
                if (currentLayer.getSource().getFeatures().length > 0) {
                    var featureStyle = currentLayer.getSource().getFeatures().map(feature => currentLayer.getStyle()(feature));
                    if (featureStyle[0].length)
                        featureStyle = [].concat.apply([], featureStyle);
                    styleArray = styleArray.concat(featureStyle);
                }
            }
            var filtered = styleArray.filter(style => !style.getText());
            var serializedStyles = filtered.map(style => me.serializeStyle(style));
            serializedStyles = utils.removeDuplicates(serializedStyles, 'hashcode');
            return serializedStyles;
        },
        /** 
        * Serialize styles
        * @memberof hs.legend.service
        * @function serializeStyle
        * @returns {style}
        */
        serializeStyle(style) {
            var image = style.getImage();
            var stroke = style.getStroke();
            var fill = style.getFill();
            var genStyle = me.setUpLegendStyle(fill, stroke, image);
            return genStyle;

        },
        /** 
        * Set up svg for legend using retreived styles
        * @memberof hs.legend.service
        * @function setUpLegendStyle
        * @returns {style}
        */
        setUpLegendStyle(fill, stroke, image) {
            var row = {};
            row.style = { maxWidth: '35px', maxHeight: '35px', marginBottom: '10px' };
            if (image && utils.instOf(image, Icon)) {
                row.icon = { type: 'icon', src: image.getSrc() };
            } else if (image && utils.instOf(image, Circle)) {
                if (image.getStroke() && image.getFill()) {
                    row.customCircle = { type: 'circle', cx: '17.5px', cy: '17.5px', r: '15px', fill: image.getFill().getColor(), stroke: image.getStroke().getColor(), strokeWidth: image.getStroke().getWidth() };
                } else if (image.getStroke()) {
                    row.customCircle = { type: 'circle', cx: '17.5px', cy: '17.5px', r: '15px', fill: 'blue', stroke: image.getStroke().getColor(), strokeWidth: image.getStroke().getWidth() };
                }
            } else {
                row.defaultCircle = { fill: 'blue', cx: '17.5px', cy: '17.5px', r: '15px' };
            }
            if (!stroke && !fill) {
                row.defaultLine = { type: 'line', stroke: 'blue', strokeWidth: '1' };
                row.defaultPolygon = { type: 'polygon', fill: 'blue', stroke: 'purple', strokeWidth: '1' };
            } else if (stroke && fill) {
                row.fullPolygon = { type: 'polygon', stroke: stroke.getColor(), strokeWidth: stroke.getWidth() / 2, fill: fill.getColor() };
                row.line = { type: 'line', stroke: stroke.getColor(), strokeWidth: stroke.getWidth() / 2 };
            } else {
                if (fill) {
                    row.polygon = { type: 'polygon', fill: fill.getColor() };
                    row.defaultLine = { type: 'line', stroke: 'blue', strokeWidth: '1' };
                } else {
                    row.line = { type: 'line', stroke: stroke.getColor(), strokeWidth: stroke.getWidth() / 2 };
                    row.defaultPolygon = { type: 'polygon', fill: 'blue', stroke: 'purple', strokeWidth: '1' };
                }
            }
            row.hashcode = JSON.stringify(row).hashCode();
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
                    visible: layer.getVisible()
                };
            } else return undefined;
        }
    })
}]

