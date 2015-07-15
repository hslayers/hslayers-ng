/**
* @namespace hs.print
* @memberOf hs  
*/ 
define(['angular'],

    function(angular) {
        angular.module('hs.print', [])
            .directive('printdialog', function() {
                return {
                    templateUrl: hsl_path + 'components/print/partials/printdialog.html'
                };
            })

        .controller('Print', ['$scope',
            function($scope) {
                $scope.title = "";

                $scope.setTitle = function(title) {
                    $scope.title = title;
                    if (!$scope.$$phase) $scope.$digest();
                }

                $scope.print = function() {
                    var canvas = canvas = document.getElementsByTagName("canvas")[0];
                    var win = window.open();
                    win.document.write("<h2>" + $scope.title + "</h2>");
                    win.document.write("<br><img src='" + canvas.toDataURL() + "'/>");
                    win.print();
                    win.location.reload();
                }

                $scope.$emit('scope_loaded', "Print");
            }
        ]);
    })
