angular.module('hs.print', [])
    .directive('printdialog', function() {
        return {
            templateUrl: 'js/components/print/partials/printdialog.html'
        };
    })
    .directive('printbutton', function() {
        return {
            templateUrl: 'js/components/print/partials/printbutton.html'
        };
    })

.controller('Print', ['$scope',
    function($scope) {

    }
]);