import 'ol-popup/src/ol-popup.css';
import Popup from 'ol-popup';
import {Select} from 'ol/interaction';
import {pointerMove} from 'ol/events/condition';

/**
 * @param $scope
 * @param $sce
 * @param HsMapService
 * @param HsCore
 * @param HsFeatureFilterService
 * @param HsLayermanagerService
 * @param HsLayoutService
 * @param HsQueryVectorService
 * @param HsConfig
 */
export default function (
  $scope,
  $sce,
  HsMapService,
  HsCore,
  HsFeatureFilterService,
  HsLayermanagerService,
  HsLayoutService,
  HsQueryVectorService,
  HsConfig
) {
  'ngInject';
  $scope.map = HsMapService.map;
  $scope.LayMan = HsLayermanagerService;

  $scope.endpoint = angular.isDefined(TESTING_ENDPOINT) ? TESTING_ENDPOINT : '';

  $scope.youtubeRegex = /^(https?:\/\/(?:www.)?)?youtube.com\/watch\?.*(?:v=(?<id>[^&/\r\n]+))/;
  $scope.vimeoRegex = /^(https?:\/\/(?:www.)?)?vimeo.com\/(?<id>[\d]+)/;
  $scope.otherSourceRegex = /^(https?:\/\/(www\.)?)?(?!.*(youtube|vimeo)).*\.\w+\//;

  $scope.parseVideo = function (url) {
    if (url.match($scope.youtubeRegex)) {
      const VIDEO_ID = url.match($scope.youtubeRegex).groups.id;
      return $sce.trustAsHtml(
        `<iframe src="https://www.youtube.com/embed/${VIDEO_ID}" type="text/html" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen>></iframe>`
      );
    } else if (url.match($scope.vimeoRegex)) {
      const VIDEO_ID = url.match($scope.vimeoRegex).groups.id;
      return $sce.trustAsHtml(
        `<iframe src="https://player.vimeo.com/video/${VIDEO_ID}" type="text/html" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>`
      );
    } else {
      return $sce.trustAsHtml(`<a href="${url}" target="_blank">${url}</a>`);
    }
  };

  const POPUP = new Popup();

  HsMapService.loaded().then((map) => {
    map.addOverlay(POPUP);
  });

  // reversing primary ordering by 'id' should usually result in displaying most recent features first
  $scope.$watch(
    () => HsLayermanagerService.currentLayer,
    (val) => {
      // $scope.reverseOrdering =
      //   HsLayermanagerService?.currentLayer?.ordering?.reverse ?? true;
      // $scope.primaryOrder =
      //   HsLayermanagerService?.currentLayer?.ordering?.primary ?? 'id';
      // $scope.secondaryOrder =
      //   HsLayermanagerService?.currentLayer?.ordering?.secondary ?? 'id';
      // $scope.defaultReverse = HsLayermanagerService?.currentLayer?.ordering
      //   ?.defaultReverse ?? ['id'];
      $scope.ordering =
        HsLayermanagerService.currentLayer &&
        HsLayermanagerService.currentLayer.ordering;
      $scope.primaryOrder =
        ($scope.ordering && $scope.ordering.primary) || 'id';
      $scope.secondaryOrder =
        ($scope.ordering && $scope.ordering.secondary) || 'id';
      $scope.defaultReverse = ($scope.ordering &&
        $scope.ordering.defaultReverse) || ['id'];
      $scope.reverseOrdering =
        $scope.defaultReverse.indexOf($scope.primaryOrder) !== -1;

      $scope.orderProperties = [
        `${$scope.reverseOrdering ? '-' : ''}getProperties().${
          $scope.primaryOrder
        }`,
        `getProperties().${$scope.secondaryOrder}`,
      ];
    }
  );

  $scope.sortBy = function (property) {
    $scope.reverseOrdering =
      $scope.primaryOrder === property
        ? !$scope.reverseOrdering
        : $scope.defaultReverse.indexOf(property) !== -1;
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
    if (!$scope.$$phase) {
      $scope.$apply();
    }
  });

  $scope.highlighter.getFeatures().on('remove', (e) => {
    e.element.setProperties({
      class: '',
    });
    if (!$scope.$$phase) {
      $scope.$apply();
    }
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
    if (!$scope.$$phase) {
      $scope.$apply();
    }

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
    if (!$scope.$$phase) {
      $scope.$apply();
    }

    HsMapService.map.getView().animate({
      resolution: $scope.lastView.resolution,
      center: $scope.lastView.center,
      duration: 300,
    });
  });
  HsLayoutService.setMainPanel('feature-list');
  $scope.$emit('scope_loaded', 'featureList');
}
