export default [
  '$compile',
  'config',
  function ($compile, config) {
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
           * @param {Object} obj Folder object of current hiearchy
           * @returns {Boolean} True if subfolders exists
           * @description Find if current folder has any subfolder
           */
          scope.folderVisible = function (obj) {
            return obj.sub_folders.length > 0;
          };

          /**
           * @ngdoc property
           * @name hs.layermanager.folderDirective#obj
           * @public
           * @type {Object}
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
  },
];
