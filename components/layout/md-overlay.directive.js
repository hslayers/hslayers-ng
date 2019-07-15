export default ['config', function (config) {
    return {
        template: require('components/layout/partials/overlay.html'),
        link: (scope, element, attrs) => {
            element.css("height", element.parent().css("height"));
            scope.$watch(() => element.parent().css("height"), () => {
                element.css("height", element.parent().css("height"));
            });
        }
    };
}]