import { Draw, Select, Modify } from "ol/interaction";
import { click, pointerMove, altKeyOnly } from "ol/events/condition.js";
import Collection from "ol/Collection";
import { Style, Icon, Stroke, Fill, Circle } from "ol/style";
import Vector from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

export default [
	"Core",
	"hs.utils.service",
	"config",
	"hs.map.service",
	"hs.laymanService",
	"hs.query.baseService",
	"$rootScope",
	"hs.utils.layerUtilsService",
	function(Core, utils, config, hsMap, laymanService, queryBaseService, $rootScope, layerUtilsService) {
		var me = this;
		angular.extend(me, {
			draw: null,
			modify: null,
			type: null,
			selectedFeatures: new Collection(),
			selectedLayer: null,
			highlighted_style(feature, resolution) {
				return [
					new Style({
						fill: new Fill({
							color: "rgba(255, 255, 255, 0.4)",
						}),
						stroke: new Stroke({
							color: "#d00504",
							width: 2,
						}),
						image: new Circle({
							radius: 5,
							fill: new Fill({
								color: "#d11514",
							}),
							stroke: new Stroke({
								color: "#d00504",
								width: 2,
							}),
						}),
					}),
				];
			},

			addDrawLayer() {
				var drawLayer = new VectorLayer({
					title: "Draw layer",
					source: new Vector(),
					show_in_manager: true,
					visible: true,
					removable: true,
					editable: true,
				});
				hsMap.map.addLayer(drawLayer);
			},

			drawableLayers() {
				if (hsMap.map) {
					const tmp = hsMap.map
						.getLayers()
						.getArray()
						.filter(layerUtilsService.isLayerDrawable);
					if (tmp.length > 0 && me.selectedLayer == null) {
						me.selectedLayer = tmp[0];
					} else if (tmp.length == 0) {
						me.selectedLayer = null;
					}
					return tmp;
				}
			},
			/**
			 * @function updateStyle
			 * @memberOf hs.draw.service
			 * @param {function} changeStyle controller callback function
			 * @description Update draw style without neccessity to reactivate drawing interaction
			 */
			updateStyle(changeStyle) {
				if (me.draw) {
					me.draw.getOverlay().setStyle(changeStyle());
				}
			},
			/**
			 * @function activateDrawing
			 * @memberOf hs.draw.service
			 * @param {function} changeStyle controller callback function which set style
			 * dynamically according to selected parameters
			 * @param {Boolean} drawState Should drawing be set active when
			 * creating the interactions
			 * @description Add drawing interaction to map. Partial interactions are Draw, Modify and Select. Add Event listeners for drawstart, drawend and (de)selection of feature.
			 */
			activateDrawing(onDrawStart, onDrawEnd, onSelected, onDeselected, changeStyle, drawState) {
				me.deactivateDrawing().then(() => {
					queryBaseService.deactivateQueries();
					me.draw = new Draw({
						source: me.source,
						type: /** @type {ol.geom.GeometryType} */ (me.type),
						style: changeStyle(),
					});

					me.draw.setActive(drawState);

					hsMap.loaded().then(map => {
						map.addInteraction(me.draw);
					});

					me.draw.on(
						"drawstart",
						function(e) {
							me.modify.setActive(false);
							if (onDrawStart) onDrawStart(e);
						},
						this,
					);

					me.draw.on(
						"drawend",
						function(e) {
							me.draw.setActive(false);
							queryBaseService.activateQueries();
							e.feature.setStyle(changeStyle());
							if (onDrawEnd) onDrawEnd(e);
						},
						this,
					);
				});
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
							me.draw = null;
						}
						resolve();
					});
				});
			},

			stopDrawing() {
				if (angular.isUndefined(me.draw) || me.draw == null) return;
				try {
					if (me.draw.getActive()) me.draw.finishDrawing();
				} catch (ex) {}
				me.draw.setActive(false);
				me.modify.setActive(false);
			},

			startDrawing() {
				try {
					if (me.draw.getActive()) me.draw.finishDrawing();
				} catch (ex) {}
				me.draw.setActive(true);
			},
		});

		hsMap.loaded().then(map => {
			me.modify = new Modify({
				features: me.selectedFeatures,
			});
			map.addInteraction(me.modify);
		});

		me.selectedFeatures.on("add", e => {
			if (me.onSelected) me.onSelected(e);
			me.modify.setActive(true);
		});

		me.selectedFeatures.on("remove", e => {
			if (me.onDeselected) me.onDeselected(e);
		});

		$rootScope.$on("vectorQuery.featureSelected", (e, feature) => {
			me.selectedFeatures.push(feature);
		});

		$rootScope.$on("vectorQuery.featureDelected", (e, feature) => {
			me.selectedFeatures.remove(feature);
		});
	},
];
