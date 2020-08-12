/**
 * @param $scope
 * @param HsMapService
 * @param HsFeatureFilterService
 * @param HsLayermanagerService
 * @param $mdPanel
 */
export default function (
  $scope,
  HsMapService,
  HsFeatureFilterService,
  HsLayermanagerService,
  $mdPanel
) {
  'ngInject';
  $scope.map = HsMapService.map;
  $scope.LayMan = HsLayermanagerService;

  const FILTERS = {
    'dictionary': require('./partials/dictionary-filter-md.html'),
    'fieldset': require('./partials/fieldset-filter-md.html'),
    'slider': require('./partials/slider-filter-md.html'),
  };

  $scope.applyFilters = HsFeatureFilterService.applyFilters;

  $scope.allSelected = function (filter) {
    return filter.selected
      ? filter.selected.length === filter.values.length
      : false;
  };

  $scope.isIndeterminate = function (filter) {
    return filter.selected
      ? filter.selected.length !== 0 &&
          filter.selected.length !== filter.values.length
      : false;
  };

  $scope.exists = function (item, list) {
    return list.indexOf(item) > -1;
  };

  $scope.toggle = function (value, selected) {
    const idx = selected.indexOf(value);
    if (idx > -1) {
      selected.splice(idx, 1);
    } else {
      selected.push(value);
    }
    $scope.applyFilters();
  };

  $scope.toggleAll = function (filter) {
    if (filter.selected.length === filter.values.length) {
      filter.selected = [];
    } else {
      filter.selected = filter.values.slice(0);
    }
    $scope.applyFilters();
  };

  $scope.filterChanged = function (filter) {
    switch (filter.type.type) {
      case 'fieldset':
      case 'dictionary':
        return filter.selected && !$scope.allSelected(filter);
    }
  };

  $scope.resetFilter = function (ev, filter) {
    ev.stopPropagation();
    switch (filter.type.type) {
      case 'fieldset':
      case 'dictionary':
        filter.selected = filter.values.slice(0);
        break;
    }
    $scope.applyFilters();
  };

  $scope.showFilter = function (ev, filter) {
    const panelPosition = $mdPanel
      .newPanelPosition()
      .relativeTo(ev.target)
      .addPanelPosition(
        $mdPanel.xPosition.ALIGN_START,
        $mdPanel.yPosition.BELOW
      );
    const panelAnimation = $mdPanel
      .newPanelAnimation()
      .openFrom(ev.target)
      .closeTo(ev.target)
      .withAnimation($mdPanel.animation.FADE);
    const panelConfig = {
      attachTo: angular.element(document).find('body'),
      position: panelPosition,
      animation: panelAnimation,
      targetEvent: ev,
      template: FILTERS[filter.type.type],
      panelClass: 'filter-panel md-whiteframe-8dp',
      scope: this,
      trapFocus: true,
      clickOutsideToClose: true,
      clickEscapeToClose: true,
    };

    $scope.selectedFilter = filter;

    $mdPanel.open(panelConfig);
  };

  $scope.$emit('scope_loaded', 'featureFilter');
}
