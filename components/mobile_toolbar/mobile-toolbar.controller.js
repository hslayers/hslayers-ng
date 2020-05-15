/**
 * @param $scope
 * @param $timeout
 * @param HsMobileToolbarService
 * @param HsCore
 * @param HsLayoutService
 */
export default function (
  $scope,
  $timeout,
  HsMobileToolbarService,
  HsCore,
  HsLayoutService
) {
  'ngInject';
  $scope.HsCore = HsCore;
  HsLayoutService.sidebarRight = false;
  HsLayoutService.sidebarExpanded = HsMobileToolbarService.panelspace0pened;
  $scope.layoutService = HsLayoutService;
  $scope.service = HsMobileToolbarService;

  /**
   * @function setMainPanel
   * @memberOf HsMobileToolbarController
   * @params which
   * @description TODO
   * @param which
   */
  $scope.setMainPanel = function (which) {
    $timeout(() => {
      HsLayoutService.setMainPanel(which, false);
    });
  };

  $scope.togglePanelspace = HsMobileToolbarService.togglePanelspace;
  togglePanelspace = HsMobileToolbarService.togglePanelspace;
  $scope.$emit('scope_loaded', 'Mobile Toolbar');
}
