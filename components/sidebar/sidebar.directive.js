export default ['$compile', 'config', function ($compile, config) {
    return {
        template: require('components/sidebar/partials/sidebar.html'),
        link: function (scope, element, attrs) {
            if (angular.isDefined(scope.Core.config.createExtraMenu))
                scope.Core.config.createExtraMenu($compile, scope, element);
            scope.$watch(
                function () {
                    var panels = document.getElementsByClassName('panelspace');
                    var panelSpaceWidth = panels.length > 0 ? panels[0].clientWidth : 0;
                    return [scope.Core.sidebarExpanded, panelSpaceWidth]
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