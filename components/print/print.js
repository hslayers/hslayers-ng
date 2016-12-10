/**
 * @namespace hs.print
 * @memberOf hs
 */
define(['angular'],

    function(angular) {
        angular.module('hs.print', [])
            /**
            * @memberof hs.print
            * @ngdoc directive
            * @name hs.print.directive
            * @description Add print dialog template to the app
            */
            .directive('hs.print.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/print/partials/printdialog.html?bust=' + gitsha
                };
            })

        /**
        * @memberof hs.print
        * @ngdoc controller
        * @name hs.print.controller
        */
        .controller('hs.print.controller', ['$scope',
            function($scope) {
                $scope.title = "";

                /**
                 * Set title of print 
                 * @memberof hs.print.controller
                 * @function setTitle 
                 * @param {string} title
                 */
                $scope.setTitle = function(title) {
                    $scope.title = title;
                    if (!$scope.$$phase) $scope.$digest();
                }

                /**
                 * 
                 * @memberof hs.print.controller
                 * @function print 
                 */
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
