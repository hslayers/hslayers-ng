import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import Collection from 'ol/Collection';
import {Select} from 'ol/interaction';
import {pointerMove} from 'ol/events/condition';

/**
 * @param $scope
 * @param HsMapService
 * @param HsCore
 * @param HsFeatureFilterService
 * @param HsLayermanagerService
 * @param HsQueryVectorService
 * @param HsConfig
 */
export default function (
	$scope,
	HsMapService,
	HsCore,
	HsFeatureFilterService,
	HsLayermanagerService,
	HsQueryVectorService,
	HsConfig
) {
	'ngInject';
	$scope.map = HsMapService.map;
	$scope.LayMan = HsLayermanagerService;

	$scope.applyFilters = HsFeatureFilterService.applyFilters;

	$scope.displayDetails = false;

	$scope.HsMapService = HsMapService;
	window.scope = $scope;
	// $scope.selectedFeatures = new Collection();

	$scope.highlighter = new Select({
		condition: pointerMove,
		style: function (feature) {
			return feature.getLayer().get('highlightedStyle')
				|| HsQueryVectorService.DEFAULT_STYLES[feature.getGeometry().getType()]
				|| null;
		},
		// style: $scope.highlightedStyle,
		filter: function(feature) {
			return feature !== HsLayermanagerService.currentLayer.selectedFeature
		},
	});

	$scope.highlightFeature = function(feature) {
		$scope.highlighter.getFeatures().push(feature);
	}


	$scope.unhighlightFeature = function(feature) {
		$scope.highlighter.getFeatures().remove(feature);
	}

	$scope.highlighter.getFeatures().on('add', e => {
		e.element.setProperties({
			class: 'highlighted'
		});
		if (!$scope.$$phase) $scope.$digest();
	});

	$scope.highlighter.getFeatures().on('remove', e => {
		e.element.setProperties({
			class: ''
		});
		if (!$scope.$$phase) $scope.$digest();
	});

	$scope.$on('map.loaded', () => {
		HsMapService.map.addInteraction($scope.highlighter);
	});

	$scope.deselectFeatures = function() {
		HsQueryVectorService.selector.getFeatures().clear();
	};

	$scope.selectFeature = function(feature) {
		HsQueryVectorService.selector.getFeatures().push(feature);
	};

	$scope.$on('vectorQuery.featureSelected', (e, feature, selector) => {
		// $scope.displayDetails = true;
		$scope.featureDetails = feature.getProperties();
		HsLayermanagerService.currentLayer.selectedFeature = feature;
		if (!$scope.$$phase) $scope.$digest();

		$scope.lastView = HsMapService.map.getView().getProperties();

		HsMapService.map.getView().animate({
			zoom: 7,
			center: feature.getProperties().geometry.flatCoordinates,
			duration: 300
		});
	});

	$scope.$on('vectorQuery.featureDeselected', (e, feature) => {
		// $scope.displayDetails = false;
		$scope.featureDetails = undefined;
		HsLayermanagerService.currentLayer.selectedFeature = undefined;
		if (!$scope.$$phase) $scope.$digest();
		
		HsMapService.map.getView().animate({
			resolution: $scope.lastView.resolution,
			center: $scope.lastView.center,
			duration: 300
		});
	});

	$scope.toggleFeatureDetails = function (feature, handleFeature) {
		// HsCore.updateMapSize();
		$scope.displayDetails = !$scope.displayDetails;

		if (HsLayermanagerService.currentLayer.selectedFeature) {
			HsLayermanagerService.currentLayer.selectedFeature.setStyle(null);
		}

		if ($scope.displayDetails) {
			$scope.featureDetails = feature.getProperties();
			HsLayermanagerService.currentLayer.selectedFeature = feature;
			HsMapService.moveToAndZoom(
				feature.getProperties().geometry.flatCoordinates[0],
				feature.getProperties().geometry.flatCoordinates[1],
				7
			);
			feature.setStyle(
				new Style({
					image: new Icon({
						crossOrigin: 'anonymous',
						src: 'marker_lt.png',
						anchor: [0.5, 1],
						scale: 0.4,
					}),
				})
			);
		}
	};

	$scope.$emit('scope_loaded', 'featureList');
}
