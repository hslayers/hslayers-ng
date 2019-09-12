import { Draw, Select, Modify } from 'ol/interaction';
import { click, pointerMove, altKeyOnly } from 'ol/events/condition.js';
import Collection from 'ol/Collection';
import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';

export default ['Core', 'hs.utils.service', 'config', 'hs.map.service', 'hs.laymanService', 'hs.query.baseService', '$rootScope',
    function (Core, utils, config, hsMap, laymanService, queryBaseService, $rootScope) {
        var me = this;
        angular.extend(me, {
            draw: null,
            modify: null,
            type: 'Point',
            selectedFeatures: new Collection(),
            highlighted_style(feature, resolution) {
                return [new Style({
                    fill: new Fill({
                        color: 'rgba(255, 255, 255, 0.4)'
                    }),
                    stroke: new Stroke({
                        color: '#d00504',
                        width: 2
                    }),
                    image: new Circle({
                        radius: 5,
                        fill: new Fill({
                            color: '#d11514'
                        }),
                        stroke: new Stroke({
                            color: '#d00504',
                            width: 2
                        })
                    })
                })]
            },
            /**
             * @function activateDrawing
             * @memberOf hs.draw.service
             * @param {Boolean} drawState Should drawing be set active when 
             * creating the interactions
             * @description Add drawing interaction to map. Partial interactions are Draw, Modify and Select. Add Event listeners for drawstart, drawend and (de)selection of feature.
             */
            activateDrawing(onDrawStart, onDrawEnd, onSelected, onDeselected, drawState) {
                me.deactivateDrawing().then(() => {
                    me.draw = new Draw({
                        source: me.source,
                        type: /** @type {ol.geom.GeometryType} */ (me.type)
                    });

                    me.draw.setActive(drawState);

                    hsMap.loaded().then(map => {
                        map.addInteraction(me.draw);
                    })

                    me.draw.on('drawstart', function (e) {
                        me.modify.setActive(false);
                        if (onDrawStart) onDrawStart(e)
                    }, this);

                    me.draw.on('drawend', function (e) {
                        me.draw.setActive(false);
                        queryBaseService.activateQueries();
                        if (onDrawEnd) onDrawEnd(e)
                    }, this);
                })

            },

            /**
             * @function deactivateDrawing
             * @memberOf hs.draw.controller
             * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
             */
            deactivateDrawing() {
                return new Promise((resolve, reject) => {
                    hsMap.loaded().then(map => {
                        queryBaseService.deactivateQueries();
                        if (me.draw) {
                            map.removeInteraction(me.draw);
                            me.draw = null;
                        }
                        resolve();
                    });
                })
            },

            stopDrawing() {
                if (angular.isUndefined(me.draw) || me.draw == null) return;
                try {
                    if (me.draw.getActive()) me.draw.finishDrawing();
                } catch (ex) { }
                me.draw.setActive(false);
                me.modify.setActive(false);
            },

            startDrawing() {
                try {
                    if (me.draw.getActive()) me.draw.finishDrawing();
                } catch (ex) { }
                me.draw.setActive(true);
            }
        })

        hsMap.loaded().then(map => {
            me.modify = new Modify({
                features: me.selectedFeatures
            });
            map.addInteraction(me.modify);
        })

        me.selectedFeatures.on('add', (e) => {
            if (me.onSelected) me.onSelected(e);
            me.modify.setActive(true);
        });

        me.selectedFeatures.on('remove', (e) => {
            if (me.onDeselected) me.onDeselected(e)
        })

        $rootScope.$on('vectorQuery.featureSelected', (e, feature) => {
            me.selectedFeatures.push(feature)
        });

        $rootScope.$on('vectorQuery.featureDelected', (e, feature) => {
            me.selectedFeatures.remove(feature)
        });
    }
]