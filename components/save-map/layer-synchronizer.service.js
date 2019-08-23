import {Vector as VectorSource} from 'ol/source';
import {  GeoJSON, KML } from 'ol/format';

export default ['Core', 'hs.utils.service', 'config', 'hs.map.service', 'hs.laymanService',
    function (Core, utils, config, hsMap, laymanService) {
        var me = this;
        angular.extend(me, {
            syncedLayers: [],
            init(map) {
                const layerAdded = (e) => me.addLayer(e.element);
                map.getLayers().on("add", layerAdded);
                map.getLayers().on("remove", function (e) {
                    me.removeLayer(e.element);
                });
                map.getLayers().forEach(lyr => {
                    layerAdded({
                        element: lyr
                    });
                })
            },

            /**
             * Start synchronizing layer to database
             * @memberof hs.layerSynchronizerService
             * @function addLayer
             * @param {object} layer Layer to add
             */
            addLayer: function (layer) {
                var descriptor = me.getLayerDescriptor(layer);
                if (descriptor) {
                    me.syncedLayers.push(layer);
                }
            },

            /**
             * Keep track of synchronized vector layers
             * @memberof hs.layerSynchronizerService
             * @function getLayerDescriptor
             * @param {object} layer Layer to add
             */
            getLayerDescriptor(layer) {
                if (utils.instOf(layer.getSource(), VectorSource)) {
                    var layerSource = layer.getSource();
                    layerSource.on('changefeature', function (e) {
                        me.synchronize(layer, e.target);
                    })
                    return layer
                }
            },

            synchronize(layer, source) {
                var f = new GeoJSON();
                var geojson = f.writeFeaturesObject(source.getFeatures());
                (config.datasources || []).filter(ds => ds.type == 'layman').forEach(
                    ds => {
                        laymanService.synchronizeVectorSource(ds, geojson);
                    })
            },

            /**
             * Stop synchronizing layer to database
             * @memberof hs.layerSynchronizerService
             * @function removeLayer
             * @param {Ol.layer} layer Layer to remove from legend
             */
            removeLayer: function (layer) {
                for (var i = 0; i < me.syncedLayers.length; i++) {
                    if (me.syncedLayers[i] == layer) {
                        me.syncedLayers.splice(i, 1);
                        break;
                    }
                }
            },
        });

        hsMap.loaded().then(me.init);
        return me;
    }]