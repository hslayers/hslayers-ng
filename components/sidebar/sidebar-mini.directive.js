/**
 * @param $compile
 * @param HsLayoutService
 */
export default function ($compile, HsLayoutService) {
  'ngInject';
  return {
    template: require('./partials/minisidebar.html'),
    link: function (scope, element, attrs) {
      if (angular.isDefined(scope.HsCore.config.createExtraMenu)) {
        scope.HsCore.config.createExtraMenu($compile, scope, element);
      }
      scope.$watch(
        () => {
          return [
            HsLayoutService.sidebarExpanded,
            document.getElementsByClassName('panelspace')[0].innerWidth,
          ];
        },
        (value) => {
          setTimeout(() => {
            scope.HsCore.updateMapSize();
          }, 0);
          scope.$emit('sidebar_change', HsLayoutService.sidebarExpanded);
        },
        true
      );
    },
  };
}
