/**
 * @param $compile
 * @param HsLayoutService
 */
export default function ($compile, HsLayoutService) {
  'ngInject';
  return {
    template: require('./partials/sidebar.html'),
    link: function (scope, element, attrs) {
      if (angular.isDefined(scope.HsCore.config.createExtraMenu)) {
        scope.HsCore.config.createExtraMenu($compile, scope, element);
      }
      scope.$watch(
        () => {
          const panels = document.getElementsByClassName('panelspace');
          const panelSpaceWidth = panels.length > 0 ? panels[0].clientWidth : 0;
          return [HsLayoutService.sidebarExpanded, panelSpaceWidth];
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
