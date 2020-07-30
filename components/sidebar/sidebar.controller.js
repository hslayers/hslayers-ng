/**
 * @param $scope
 * @param $timeout
 * @param HsCore
 * @param HsPermalinkUrlService
 * @param HsSidebarService
 * @param HsLayoutService
 * @param HsConfig
 */
export default function (
  $scope,
  $timeout,
  HsCore,
  HsPermalinkUrlService,
  HsSidebarService,
  HsLayoutService,
  HsConfig
) {
  'ngInject';
  $scope = angular.extend($scope, {
    layoutService: HsLayoutService,
    sidebarService: HsSidebarService,
    showUnimportant: false,
    /**
     * Set visibility parameter of buttons object
     *
     * @memberof HsSidebarController
     * @function setPanelState
     * @param {object} buttons Buttons object
     */
    setPanelState(buttons) {
      for (const button of buttons) {
        if (
          HsLayoutService.panelEnabled(button.panel) &&
          $scope.checkConfigurableButtons(button)
        ) {
          if (!HsSidebarService.visibleButtons.includes(button.panel)) {
            HsSidebarService.visibleButtons.push(button.panel);
            button.visible = true;
          }
        } else {
          button.visible = false;
        }
      }
    },

    /**
     * Seat weather to show all sidebar buttons or just a
     * subset of important ones
     *
     * @memberof HsSidebarController
     * @function toggleUnimportant
     */
    toggleUnimportant() {
      $scope.showUnimportant = !$scope.showUnimportant;
    },

    /**
     * Returns if a button should be visible by its 'important'
     * property and current view mode defined in showUnimportant variable
     *
     * @memberof HsSidebarController
     * @function visibilityByImportancy
     * @param button
     */
    visibilityByImportancy(button) {
      if (HsLayoutService.sidebarBottom()) {
        return true;
      } else {
        return (
          button.important ||
          angular.isUndefined(button.important) ||
          !HsSidebarService.unimportantExist ||
          $scope.showUnimportant
        );
      }
    },

    /**
     * Checks whether the panels, which could be placed both in map or
     * in sidebar, have state defined in config.panelsEnabled. If yes it
     * should be placed in sidebar rather then in map.
     * It´s necessary for buttons like 'measure' because simple
     * 'config.panelsEnabled = false' would prevent their functionality.
     *
     * @memberof HsSidebarController
     * @function checkConfigurableButtons
     * @param {object} button buttons Buttons object
     */
    checkConfigurableButtons(button) {
      if (typeof button.condition == 'undefined') {
        return true;
      } else if (angular.isUndefined(HsConfig.panelsEnabled)) {
        return false;
      } else {
        return HsConfig.panelsEnabled[button.panel];
      }
    },

    /**
     * @ngdoc method
     * @name HsSidebarController#fitsSidebar
     * @public
     * @param {string} which Sidear button to be checked (specify panel name)
     * @description Check if sidebar button should be visible in classic sidebar or hidden inside minisidebar panel
     * @description Toggles minisidebar button
     */
    fitsSidebar(which) {
      if (window.innerWidth > 767) {
        HsLayoutService.minisidebar = false;
        return true;
      } else {
        if (
          HsSidebarService.visibleButtons.indexOf(which) + 1 >=
            window.innerWidth / 60 &&
          window.innerWidth / 60 <= HsSidebarService.visibleButtons.length - 1
        ) {
          HsLayoutService.minisidebar = true;
          return true;
        }
        if (
          window.innerWidth >
          (HsSidebarService.visibleButtons.length - 1) * 60
        ) {
          HsLayoutService.minisidebar = false;
        }
      }
    },

    /**
     * Toggle sidebar mode between expanded and narrow
     *
     * @memberof HsSidebarController
     * @function toggleSidebar
     */
    toggleSidebar() {
      HsLayoutService.sidebarExpanded = !HsLayoutService.sidebarExpanded;
    },
  });

  if (HsPermalinkUrlService.getParamValue('hs_panel')) {
    if (HsCore.exists('hs.sidebar') && !HsLayoutService.minisidebar) {
      HsLayoutService.setMainPanel(
        HsPermalinkUrlService.getParamValue('hs_panel')
      );
    }
  }
  $scope.setPanelState(HsSidebarService.buttons);
  $scope.$emit('scope_loaded', 'Sidebar');
}
