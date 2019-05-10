/**
 * @namespace hs.print
 * @memberOf hs
 */
define(['angular'], function (angular) {
    var module = angular.module('hs.print', []);
    /**
     * @memberof hs.print
     * @ngdoc component
     * @name hs.print.component
     * @description Add print dialog template to the app
     */
    module.component('hs.print', {
        template: require('components/print/partials/printdialog.html'),
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
    });


    /**
     * @memberof hs.print
     * @ngdoc service
     * @name hs.print.service
     */
    module.service('hs.print.service', ['$timeout', function ($timeout) {
        var me = {};
        return angular.extend(me, {

            /**
             * @memberof hs.print.service
             * @function print
             * @public
             * @params {String} title 
             * @description Basic print implementation
             */
            print: function (title) {
                var canvas = canvas = document.getElementsByTagName("canvas")[0];
                var img = canvas.toDataURL("image/png");
                var win = window.open();
                var html = "<html><head></head><body><h2>" + title + "</h2><br><img src='" + img + "'/></body></html>";
                win.document.write(html);
                $timeout(function () {
                    win.print();
                    //win.location.reload();
                }, 250);
            }

        })
    }]);
})
