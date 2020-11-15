import * as extent from 'ol/extent';
import {Select} from 'ol/interaction';
import {Vector} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {Fill, Stroke, Circle, Style} from 'ol/style';
import GeometryType from 'ol/geom/GeometryType';
import {WKT} from 'ol/format';
import {click} from 'ol/events/condition';
import {toLonLat} from 'ol/proj';

/**
 * @param $rootScope
 * @param HsQueryBaseService
 * @param $sce
 * @param HsMapService
 * @param HsConfig
 * @param HsLayerUtilsService
 * @param $window
 * @param HsMeasureService
 * @param HsUtilsService
 */
export default function (
$rootScope,
HsQueryBaseService,
$sce,
HsMapService,
HsConfig,
HsLayerUtilsService,
$window,
HsMeasureService,
HsUtilsService
) {
'ngInject';
const me = this;

const DEFAULT_STYLES = (() => {
	let styles = [];
	const white = [255, 255, 255, 1];
	const blue = [0, 153, 255, 1];
	const width = 3;
	styles[GeometryType.POLYGON] = [
		new Style({
			fill: new Fill({
				color: [255, 255, 255, 0.5]
			})
		})
	];
	styles[GeometryType.MULTI_POLYGON] = styles[GeometryType.POLYGON];
	styles[GeometryType.LINE_STRING] = [
		new Style({
			stroke: new Stroke({
				color: white,
				width: width + 2
			})
		}),
		new Style({
			stroke: new Stroke({
				color: blue,
				width: width
			})
		})
	];
	styles[GeometryType.MULTI_LINE_STRING] =
	styles[GeometryType.LINE_STRING];
	styles[GeometryType.POINT] = [
		new Style({
			image: new Circle({
				radius: width * 2,
				fill: new Fill({
					color: blue
				}),
				stroke: new Stroke({
					color: white,
					width: width / 2
				})
			}),
			zIndex: Infinity
		})
	];
	styles[GeometryType.MULTI_POINT] =
	styles[GeometryType.POINT];
	styles[GeometryType.GEOMETRY_COLLECTION] =
	styles[GeometryType.POLYGON].concat(
		styles[GeometryType.LINE_STRING],
		styles[GeometryType.POINT]
	);

	return styles;
})();

this.selector = new Select({
	condition: click,
	multi:
	angular.isDefined(HsConfig.query) && HsConfig.query.multi
		? HsConfig.query.multi
		: false,
	filter: function (feature, layer) {
		if (layer === null) {
			return;
		}
		if (layer.get('queryable') === false) {
			return false;
		} else {
			return true;
		}
	},
	style: function (feature) {
		const selectedStyle = feature.getLayer().get('selectedStyle');
		return typeof selectedStyle === "function"
			? selectedStyle(feature)
			: selectedStyle
			|| DEFAULT_STYLES[feature.getGeometry().getType()]
			|| null;
	}
});

$rootScope.$broadcast('vectorSelectorCreated', me.selector);
console.log('vectorSelectorCreated', me.selector);

$rootScope.$on('map.loaded', (e) => {
	HsMapService.map.addInteraction(me.selector);
});

$rootScope.$on('queryStatusChanged', () => {
	/*if (Base.queryActive) OlMap.map.addInteraction(me.selector);
			else OlMap.map.removeInteraction(me.selector);*/
});

me.selector.getFeatures().on('add', (e) => {
	$rootScope.$broadcast(
	'vectorQuery.featureSelected',
	e.element,
	me.selector
	);
	//deprecated
	$rootScope.$broadcast('infopanel.feature_selected', e.element, me.selector);
});

me.selector.getFeatures().on('remove', (e) => {
	$rootScope.$broadcast('vectorQuery.featureDeselected', e.element);
	//deprecated
	$rootScope.$broadcast('infopanel.feature_deselected', e.element);
});

$rootScope.$on('mapQueryStarted', (e) => {
	HsQueryBaseService.clearData('features');
	if (!HsQueryBaseService.queryActive) {
	return;
	}
	me.createFeatureAttributeList();
});
me.createFeatureAttributeList = () => {
	HsQueryBaseService.data.attributes.length = 0;
	const features = me.selector.getFeatures().getArray();
	let featureDescriptions = [];
	angular.forEach(features, (feature) => {
	featureDescriptions = featureDescriptions.concat(
		getFeatureAttributes(feature)
	);
	});
	HsQueryBaseService.setData(featureDescriptions, 'features');
	$rootScope.$broadcast('queryVectorResult');
};
me.exportData = (clickedFormat, feature) => {
	if (clickedFormat == 'WKT format') {
	const formatWKT = new WKT();
	const wktRepresentation = formatWKT.writeFeature(feature);
	const data = new Blob([wktRepresentation], {type: 'text/plain'});
	const url = $window.URL.createObjectURL(data);
	if (me.exportedFeatureHref) {
		$window.URL.revokeObjectURL(me.exportedFeatureHref);
	}
	me.exportedFeatureHref = url;
	} else {
	return;
	}
};

/**
 * @param feature
 */
function getFeatureLayerName(feature) {
	if (angular.isUndefined(feature.getLayer)) {
	return '';
	}
	const layer = feature.getLayer(HsMapService.map);
	return HsLayerUtilsService.getLayerName(layer);
}

/**
 * @param feature
 */
function getCentroid(feature) {
	if (angular.isUndefined(feature)) {
	return;
	}
	const center = extent.getCenter(feature.getGeometry().getExtent());
	return center;
}
/**
 * (PRIVATE) Adding a default stats to query based on feature geom type
 *
 * @function addDefaultAttributes
 * @param f
 * @memberOf HsQueryController
 * @param feature Selected feature from map
 */
function addDefaultStats(f) {
	const geom = f.getGeometry();
	const type = geom.getType();
	if (type == 'Polygon') {
	const area = HsMeasureService.formatArea(geom);
	return [
		{name: `${area.type} in ${area.unit}`, value: area.size},
		{name: 'center', value: toLonLat(getCentroid(f))},
	];
	}
	if (type == 'LineString') {
	const length = HsMeasureService.formatLength(geom);
	return [
		{name: `${length.type} in ${length.unit}`, value: length.size},
		{name: 'center', value: toLonLat(getCentroid(f))},
	];
	}
	if (type == 'Point') {
	return [{name: 'center', value: toLonLat(getCentroid(f))}];
	}
}

/**
 * @param {ol/Feature} feature
 * @returns {ol/source/Source}
 */
function olSource(feature) {
	const layer = feature.getLayer(HsMapService.map);
	if (angular.isUndefined(layer)) {
	return;
	} else if (layer.getSource().getSource) {
	return layer.getSource().getSource();
	} else {
	return layer.getSource();
	}
}

/**
 * @param {ol/Feature} feature
 * @returns {boolean}
 */
me.isFeatureRemovable = function (feature) {
	const source = olSource(feature);
	if (angular.isUndefined(source)) {
	return false;
	}
	const layer = feature.getLayer(HsMapService.map);
	return (
	HsUtilsService.instOf(source, VectorSource) &&
	HsLayerUtilsService.isLayerEditable(layer)
	);
};

/**
 * @param {ol/layer/Layer} layer
 * @returns {boolean}
 */
me.isLayerEditable = function (layer) {
	return HsLayerUtilsService.isLayerEditable(layer);
};

/**
 * @param {ol/Feature} feature
 */
me.removeFeature = function (feature) {
	const source = olSource(feature);
	if (HsUtilsService.instOf(source, VectorSource)) {
	source.removeFeature(feature);
	}
};

/**
 * (PRIVATE) Handler for querying vector layers of map. Get information about selected feature.
 *
 * @function getFeatureAttributes
 * @memberOf HsQueryController
 * @param feature Selected feature from map
 */
function getFeatureAttributes(feature) {
	const attributes = [];
	let tmp = [];
	const hstemplate = feature.get('hstemplate')
	? feature.get('hstemplate')
	: null;
	let customInfoTemplate = null;
	feature.getKeys().forEach((key) => {
	if (['gid', 'geometry', 'wkb_geometry'].indexOf(key) > -1) {
		return;
	}
	if (key == 'features') {
		for (const subFeature of feature.get('features')) {
		tmp = tmp.concat(getFeatureAttributes(subFeature));
		}
	} else {
		let obj;
		if ((typeof feature.get(key)).toLowerCase() == 'string') {
		obj = {
			name: key,
			value: $sce.trustAsHtml(feature.get(key)),
		};
		} else {
		obj = {
			name: key,
			value: feature.get(key),
		};
		}
		attributes.push(obj);
	}
	});
	if (
	feature.getLayer &&
	feature.getLayer(HsMapService.map).get('customInfoTemplate')
	) {
	customInfoTemplate = feature
		.getLayer(HsMapService.map)
		.get('customInfoTemplate');
	}

	const featureDescription = {
	layer: getFeatureLayerName(feature),
	name: 'Feature',
	attributes: attributes,
	stats: addDefaultStats(feature),
	hstemplate,
	feature,
	customInfoTemplate: $sce.trustAsHtml(customInfoTemplate),
	};
	tmp.push(featureDescription);
	return tmp;
}
return me;
}
