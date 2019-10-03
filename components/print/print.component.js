export default {
    template: ['config', (config) => {
        if (config.design == 'md')
            return require('components/print/partials/printdialogmd.html')
        else
            return require('components/print/partials/printdialog.html')
    }],
    controller: ['$scope', 'hs.print.service', function ($scope, PrintS) {
        angular.extend($scope, {
            title: "",

            /**
             * Set title of print 
             * @memberof hs.print.component
             * @function setTitle 
             * @param {string} title
             */
            setTitle: function (title) {
                $scope.title = title;
                if (!$scope.$$phase) $scope.$digest();
            },

            /**
             * 
             * @memberof hs.print.component
             * @function print 
             */
            print: function () {
                PrintS.print($scope.title);
            }
        })

        $scope.$emit('scope_loaded', "Print");
    }]
}