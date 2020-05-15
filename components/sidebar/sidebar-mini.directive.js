export default ['$compile', 'HsConfig', 'HsLayoutService', function ($compile, config, layoutService) {
    return {
        template: require('components/sidebar/partials/minisidebar.html'),
        link: function (scope, element, attrs) {
            if (angular.isDefined(scope.HsCore.config.createExtraMenu))
                scope.HsCore.config.createExtraMenu($compile, scope, element);
            scope.$watch(
                function () {
                    return [layoutService.sidebarExpanded, document.getElementsByClassName('panelspace')[0].innerWidth]
                },
                function (value) {
                    setTimeout(function () {
                        scope.HsCore.updateMapSize();
                    }, 0)
                    scope.$emit('sidebar_change', layoutService.sidebarExpanded);
                }, true
            )
        }
    };
}]