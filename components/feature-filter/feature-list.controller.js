import 'ol-popup/src/ol-popup.css';
import Popup from 'ol-popup';
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

  const POPUP = new Popup();

  HsMapService.loaded().then((map) => {
    map.addOverlay(POPUP);
  });

  $scope.reverseOrdering = true;
  $scope.orderProperty = 'position';
  $scope.defaultOrder = 'bp_id';

  $scope.defaultReverse = ['bp_id', 'position'];

  $scope.orderProperties = [
    `${$scope.reverseOrdering ? '-' : ''}getProperties().${
      $scope.orderProperty
    }`,
    `getProperties().${$scope.defaultOrder}`,
  ];

  $scope.sortBy = function (property) {
    $scope.reverseOrdering =
      $scope.orderProperty === property ? !$scope.reverseOrdering : false;
    $scope.orderProperties[0] = `${
      $scope.reverseOrdering ? '-' : ''
    }getProperties().${property}`;
  };

  $scope.applyFilters = HsFeatureFilterService.applyFilters;
  $scope.HsMapService = HsMapService;

  $scope.highlighter = new Select({
    condition: pointerMove,
    style: function (feature) {
      return (
        feature.getLayer().get('highlightedStyle') ||
        HsQueryVectorService.DEFAULT_STYLES[feature.getGeometry().getType()] ||
        null
      );
    },
    filter: function (feature) {
      return feature !== HsLayermanagerService.currentLayer.selectedFeature;
    },
  });

  $scope.highlightFeature = function (feature) {
    $scope.highlighter.getFeatures().push(feature);
  };

  $scope.unhighlightFeature = function (feature) {
    $scope.highlighter.getFeatures().remove(feature);
  };

  $scope.highlighter.getFeatures().on('add', (e) => {
    e.element.setProperties({
      class: 'highlighted',
    });
    if (!$scope.$$phase) $scope.$apply();
  });

  $scope.highlighter.getFeatures().on('remove', (e) => {
    e.element.setProperties({
      class: '',
    });
    if (!$scope.$$phase) $scope.$apply();
  });

  $scope.highlighter.on('select', (e) => {
    if (e.deselected.length > 0) {
      POPUP.hide();
    }
    if (e.selected.length > 0) {
      const FEATURE = e.selected[0];
      const COORDS = FEATURE.getProperties().geometry.flatCoordinates;
      POPUP.show(COORDS, FEATURE.getProperties().name);
    }
  });

  $scope.$on('map.loaded', () => {
    HsMapService.map.addInteraction($scope.highlighter);
  });

  $scope.deselectFeatures = function () {
    HsQueryVectorService.selector.getFeatures().clear();
  };

  $scope.selectFeature = function (feature) {
    HsQueryVectorService.selector.getFeatures().push(feature);
  };

  $scope.$on('vectorQuery.featureSelected', (e, feature, selector) => {
    $scope.featureDetails = feature.getProperties();
    HsLayermanagerService.currentLayer.selectedFeature = feature;
    if (!$scope.$$phase) $scope.$apply();

    $scope.lastView = HsMapService.map.getView().getProperties();

    HsMapService.map.getView().animate({
      zoom: 7,
      center: feature.getProperties().geometry.flatCoordinates,
      duration: 300,
    });
  });

  $scope.$on('vectorQuery.featureDeselected', (e, feature) => {
    $scope.featureDetails = undefined;
    HsLayermanagerService.currentLayer.selectedFeature = undefined;
    if (!$scope.$$phase) $scope.$apply();

    HsMapService.map.getView().animate({
      resolution: $scope.lastView.resolution,
      center: $scope.lastView.center,
      duration: 300,
    });
  });
  $scope.$emit('scope_loaded', 'featureList');
}
