export default ['$compile', 'config', function ($compile, config) {
    return {
        template: require('./object.html'),
        compile: function compile(element) {
            var contents = element.contents().remove();
            var contentsLinker;

            return function (scope, iElement) {
                scope.isIteratable = function (obj) {
                    return typeof obj == 'object'
                };

                if (scope.value == null) {
                    scope.obj = "-";
                } else {
                    scope.obj = scope.value;
                }

                if (angular.isUndefined(contentsLinker)) {
                    contentsLinker = $compile(contents);
                }

                contentsLinker(scope, function (clonedElement) {
                    iElement.append(clonedElement);
                });
            };
        }
    };
}]