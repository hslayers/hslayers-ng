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
         * @ngdoc service
         * @name hs.print.service
         */
        .service('hs.print.service', ['$timeout', 
            function($timeout) {
                var me = {};
                /**
                 * @memberof hs.print.service
                 * @function print
                 * @public
                 * @params {String} title 
                 * @description Basic print implementation
                 */
                me.print = function(title) {
                    var canvas = canvas = document.getElementsByTagName("canvas")[0];
                    var img = canvas.toDataURL("image/png");
                    var win = window.open();
                    var html = "<html><head></head><body><h2>" + title + "</h2><br><img src='" + img + "'/></body></html>";
                    win.document.write(html);
                    $timeout(function(){
                        win.print();
                        win.location.reload();
                    },250);
                }
                
                return me;
            }])
        
        /**
         * @memberof hs.print
         * @ngdoc controller
         * @name hs.print.controller
         */
        .controller('hs.print.controller', ['$scope','hs.print.service',
            function($scope, PrintS) {
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
                    PrintS.print($scope.title);
                }

                $scope.$emit('scope_loaded', "Print");
            }
        ]);
    })
