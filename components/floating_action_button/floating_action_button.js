/**
 * @namespace hs.floating_action_button
 * @memberOf hs
 */
define(['angular', 'core'],

    function(angular) {
        angular.module('hs.floating_action_button', ['hs.core'])
            /**
            * @memberof hs.floating_action_button
            * @ngdoc service
            * @name HsFloatingActionButtonService
            * @description TODO
            */
            .factory('HsFloatingActionButtonService', ['HsCore',
                function(HsCore) {
                    return this;
                }
            ])
            /**
            * @memberof hs.floating_action_button
            * @ngdoc directive
            * @name hs.floating_action_button.directive
            * @description TODO
            */
            .directive('hs.floatingActionButton.directive', ['HsConfig', function (config) {
                return {
                    template: require('components/floating_action_button/partials/floating_action_button.html')
                };
            }])

        /**
        * @memberof hs.floating_action_button
        * @ngdoc controller
        * @name HsFloatingActionButtonController
        * @description TODO
        */
        .controller('HsFloatingActionButtonController', ['$scope', 'HsFloatingActionButtonService', 'HsCore', '$window',
            function($scope, service, HsCore, $window) {
                $scope.primary = {
                    classes: ["btn-large"],
                    icon: {
                        classes: ["material-icons"],
                        text: "add"
                    }
                };

                $scope.secondary = [
                    {
                        classes: [{
                            tooltipped: true
                        }
                        ],
                        icon: {
                            classes: ["icon-polygonlasso"],
                            text: ""
                        },
                        href: "#",
                        tooltip: "Polygon",
                        action: function() {
                            console.log("Polygon");
                        }
                    },
                    {
                        classes: [{
                            tooltipped: true
                        }],
                        icon: {
                            classes: ["icon-line"],
                            text: ""
                        },
                        href: "#",
                        tooltip: "Line",
                        action: function() {
                            console.log("Line");
                        }
                    },
                    {
                        classes: [{
                            tooltipped: true
                        }],
                        icon: {
                            classes: ["icon-pin"],
                            text: ""
                        },
                        href: "#",
                        tooltip: "Point",
                        action: function() {
                            console.log("Point");
                        }
                    }
                ];

                $scope.$emit('scope_loaded', "Floating Action Button");
            }

        ]);
    })
