/**
 * @namespace hs.customhtml
 * @memberOf hs
 */
define(['angular', 'ol'],
    function(angular, ol) {
        angular.module('hs.customhtml', [])
            .directive('hs.customhtml.directive', [function() {
                return {
                    templateUrl: 'customhtml.html?bust=' + gitsha,
                    link: function link(scope, element, attrs) {},
                    replace: true
                };
            }])
            .controller('hs.customhtml.controller', ['$scope', function($scope) {

            }])
    })
