export default {
  template: [
    'HsConfig',
    (config) => {
      if (config.design == 'md') {
        return require('./partials/printdialogmd.html');
      } else {
        return require('./partials/printdialog.html');
      }
    },
  ],
  controller: [
    '$scope',
    'HsPrintService',
    '$timeout',
    function ($scope, PrintS, $timeout) {
      angular.extend($scope, {
        title: '',

        /**
         * Set title of print
         * @memberof hs.print.component
         * @function setTitle
         * @param {string} title Title of printed page
         */
        setTitle: function (title) {
          $timeout(() => {
            $scope.title = title;
          }, 0);
        },

        /**
         *
         * @memberof hs.print.component
         * @function print
         */
        print: function () {
          PrintS.print($scope.title);
        },
      });

      $scope.$emit('scope_loaded', 'Print');
    },
  ],
};
