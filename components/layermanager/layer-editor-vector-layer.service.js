import { Stroke, Fill, Circle, RegularShape, Text, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import { Cluster, Vector as VectorSource } from 'ol/source';
import layerEditorSubLayerCheckboxesDirective from './layer-editor.sub-layer-checkboxes.directive';

export default ['hs.map.service', function (hsMap) {
    let me = {};
    /**
     * @function Declutter
    * @memberOf hs.layerEditor.service
    * @description Set declutter of features;
     */
    me.declutter = function (newValue, layer) {
        let index = hsMap.map.getLayers().getArray().indexOf(layer);
        if (newValue == true && !layer.get('cluster')) {
            hsMap.map.removeLayer(layer);
            hsMap.map.getLayers().insertAt(index,
                me.cloneVectorLayer(layer, newValue)
            );
        } else {
            hsMap.map.removeLayer(layer);
            hsMap.map.getLayers().insertAt(index,
                me.cloneVectorLayer(layer, false));
        }
    }
    me.cloneVectorLayer = function (layer, declutter) {
        let options = {};
        layer.getKeys().forEach(k => options[k] = layer.get(k));
        angular.extend(options, {
            declutter,
            source: layer.getSource(),
            style: layer.getStyleFunction() || layer.getStyle(),
            maxResolution: layer.getMaxResolution(),
            minResolution: layer.getMinResolution(),
            visible: layer.getVisible(),
            opacity: layer.getOpacity()
        });
        return new VectorLayer(options)
    }
    /**
  * @function cluster
  * @memberOf hs.layerEditor.service
  * @description Set cluster for layer;
  */
    me.cluster = function (newValue, layer, distance) {
        if (!layer.hsOriginalStyle) {
            layer.hsOriginalStyle = layer.getStyle();
        }
        if (newValue == true && !layer.get('declutter')) {
            var styleCache = {};
            layer.setSource(me.createClusteredSource(layer, distance));
            layer.setStyle(function (feature, resolution) {
                var size = feature.get('features').length;
                if (size > 1) {
                    var textStyle = styleCache[size];
                    if (!textStyle) {
                        textStyle = new Style({
                            image: new Circle({
                                radius: 10,
                                stroke: new Stroke({
                                    color: '#fff'
                                }),
                                fill: new Fill({
                                    color: '#3399CC'
                                })
                            }),
                            text: new Text({
                                text: size.toString(),
                                fill: new Fill({
                                    color: '#000'
                                })
                            })
                        });
                        styleCache[size] = textStyle;
                    }
                    return textStyle;
                } else {
                    if (typeof layer.hsOriginalStyle == 'function')
                        return layer.hsOriginalStyle(feature, resolution)
                    else
                        return layer.hsOriginalStyle;
                }

            })
        } else {
            layer.setStyle(function () {
                if (typeof layer.hsOriginalStyle == 'function')
                    return layer.hsOriginalStyle();
                else
                    return layer.hsOriginalStyle;
            });
            layer.setSource(layer.getSource().getSource())
        }
    }
    me.createClusteredSource = function (layer, distance) {
        return new Cluster({
            distance: distance,
            source: layer.getSource(),
        });
    }
    return me;
}
]