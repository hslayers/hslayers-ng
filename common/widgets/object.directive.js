/**
 * @param $compile
 * @param HsConfig
 */
export default function ($compile, HsConfig) {
  'ngInject';
  return {
    template: require('./object.html'),
    compile: function compile(element) {
      const contents = element.contents().remove();
      let contentsLinker;

      return function (scope, iElement) {
        scope.isIteratable = function (obj) {
          return typeof obj == 'object';
        };

        if (scope.value === null) {
          scope.obj = '-';
        } else {
          scope.obj = scope.value;
        }

        if (angular.isUndefined(contentsLinker)) {
          contentsLinker = $compile(contents);
        }

        contentsLinker(scope, (clonedElement) => {
          iElement.append(clonedElement);
        });
      };
    },
  };
}
