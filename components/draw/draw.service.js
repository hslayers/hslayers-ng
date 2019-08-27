import { Draw, Select, Modify } from 'ol/interaction';
import { click, pointerMove, altKeyOnly } from 'ol/events/condition.js';
import Collection from 'ol/Collection';
import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';

export default ['Core', 'hs.utils.service', 'config', 'hs.map.service', 'hs.laymanService',
    function (Core, utils, config, hsMap, laymanService) {
        var me = this;
        angular.extend(me, {
            draw: null,
            modify: null,
            selector: null,
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
                    me.modify = new Modify({
                        features: me.selectedFeatures
                    });

                    me.selector = new Select({
                        condition: click
                    });

                    hsMap.loaded().then(map => {
                        map.addInteraction(me.draw);
                        map.addInteraction(me.modify);
                        map.addInteraction(me.selector);
                    })

                    me.draw.on('drawstart', function (e) {
                        me.modify.setActive(false);
                        if (onDrawStart) onDrawStart(e)
                    }, this);

                    me.draw.on('drawend', function (e) {
                        me.draw.setActive(false);
                        if (onDrawEnd) onDrawEnd(e)
                    }, this);

                    if (onSelected) 
                        me.selector.getFeatures().on('add', onSelected);

                    if (onDeselected) 
                        me.selector.getFeatures().on('remove', onDeselected);
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
                        if (me.draw) {
                            map.removeInteraction(me.draw);
                            map.removeInteraction(me.modify);
                            map.removeInteraction(me.selector);
                            me.draw = null;
                            me.modify = null;
                            me.selector = null;
                        }
                        resolve();
                    });
                })
            },

            stopDrawing() {
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
    }
]