/**
 * @param $compile
 */
export default function ($compile) {
  'ngInject';
  return {
    template: require('./partials/folder.html'),
    compile: function compile(element) {
      const contents = element.contents().remove();
      let contentsLinker;

      return function (scope, iElement) {
        /**
         * @ngdoc method
         * @name hs.layermanager.folderDirective#folderVisible
         * @public
         * @param {object} obj Folder object of current hiearchy
         * @returns {boolean} True if subfolders exists
         * @description Find if current folder has any subfolder
         */
        scope.folderVisible = function (obj) {
          return obj.sub_folders.length > 0;
        };

        /**
         * @ngdoc property
         * @name hs.layermanager.folderDirective#obj
         * @public
         * @type {object}
         * @description Container for folder object of current folder instance. Either full folders object or its subset based on hierarchy place of directive
         */
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
