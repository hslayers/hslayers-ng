export default ['$compile', 'config', 'hs.layout.service', function ($compile, config, layoutService) {
    return {
        template: require('components/sidebar/partials/minisidebar.html'),
        link: function (scope, element, attrs) {
            if (angular.isDefined(scope.Core.config.createExtraMenu))
                scope.Core.config.createExtraMenu($compile, scope, element);
            scope.$watch(
                function () {
                    return [layoutService.sidebarExpanded, document.getElementsByClassName('panelspace')[0].innerWidth]
                },
                function (value) {
                    setTimeout(function () {
                        scope.Core.updateMapSize();
                    }, 0)
                    scope.$emit('sidebar_change', layoutService.sidebarExpanded);
                }, true
            )
        }
    };
}]