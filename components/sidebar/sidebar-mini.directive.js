export default ['$compile', 'config', function ($compile, config) {
    return {
        template: require('components/sidebar/partials/minisidebar.html'),
        link: function (scope, element, attrs) {
            if (angular.isDefined(scope.Core.config.createExtraMenu))
                scope.Core.config.createExtraMenu($compile, scope, element);
            scope.$watch(
                function () {
                    return [scope.Core.sidebarExpanded, document.getElementsByClassName('panelspace')[0].innerWidth]
                },
                function (value) {
                    setTimeout(function () {
                        scope.Core.updateMapSize();
                    }, 0)
                    scope.$emit('sidebar_change', scope.Core.sidebarExpanded);
                }, true
            )
        }
    };
}]