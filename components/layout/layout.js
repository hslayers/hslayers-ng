/**
 * @namespace hs.layout
 * @memberOf hs
 */
define(['angular', 'core', 'map'],

    function(angular) {
        angular.module('hs.layout', ['hs.core', 'hs.map'])
            /**
            * @memberof hs.mdLayout
            * @ngdoc directive
            * @name hs.mdLayout.directive
            * @description TODO
            */
            .directive('hs.layout.directive', ['hs.map.service', 'Core', '$timeout', 'config',
                function(OlMap, Core, $timeout, config) {
                    return {
                        templateUrl: `${hsl_path}components/layout/partials/layout${config.design || ''}.html?bust=${gitsha}`,
                        link: function(scope, element) {
                            Core.init(element, {
                                innerElement: '#map-container'
                            });
                    
                            //Hack - flex map container was not initialized when map loaded 
                            var container = $('#map-container');
                            
                            if (container.height() === 0) {
                                containerCheck();
                            }
                            
                            function containerCheck(){
                                $timeout(function(){
                                    if (container.height() != 0) scope.$emit("Core_sizeChanged");
                                    else containerCheck();
                                },100);
                            }
                        }
                    };
                }
            ])

            /**
            * @memberof hs.mdSidenav
            * @ngdoc directive
            * @name hs.mdSidenav.directive
            * @description TODO
            */
            .directive('hs.mdSidenav.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/layout/partials/sidenav.html?bust=' + gitsha
                };
            })

            /**
            * @memberof hs.mdToolbar
            * @ngdoc directive
            * @name hs.mdToolbar.directive
            * @description TODO
            */
            .directive('hs.mdToolbar.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/layout/partials/toolbar.html?bust=' + gitsha
                };
            })

            .directive('hs.mdOverlay.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/layout/partials/overlay.html?bust=' + gitsha,
                    link: (scope, element, attrs) => {
                        console.log(element, element.parent());
                        element.css("height", element.parent().css("height"));
                        scope.$watch(() => element.parent().css("height"), () => {
                            element.css("height", element.parent().css("height"));
                        });
                    }
                };
            })

            .directive('hs.swipeArea.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/layout/partials/swipe-area.html?bust=' + gitsha
                };
            })

            .directive('hs.bottomSheetScroll', function () {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        var raw = element[0];
                        scope.$watch(() => raw.scrollHeight,
                        () => {
                            if (raw.scrollHeight > raw.clientHeight) {
                                raw.style["touch-action"] = "pan-y";
                            } else {
                                raw.style["touch-action"] = "none";
                            }
                        });
                        element.bind('scroll', function () {
                            raw.style["touch-action"] = "pan-y";
                            if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
                                raw.style["touch-action"] = "pan-up";
                            }
                            if (raw.scrollTop == 0) {
                                raw.style["touch-action"] = "pan-down";
                            }
                        })
                    }
                };
            })

            /**
            * @memberof hs.layout
            * @ngdoc controller
            * @name hs.layout.controller
            * @description TODO
            */
            .controller('hs.layout.controller', ['$scope', '$rootScope', '$window', 'Core', 'hs.map.service', 'hs.geolocation.service', 'gettextCatalog', 'config', '$templateCache', '$timeout', '$interval', '$mdSidenav', '$mdMenu', '$mdBottomSheet', '$mdPanel',
                function($scope, $rootScope, $window, Core, OlMap, Geolocation, gettextCatalog, config, $templateCache, $timeout, $interval, $mdSidenav, $mdMenu, $mdBottomSheet, $mdPanel) {
                    $scope.Core = Core;
                    $scope.geolocation = Geolocation;
                    $scope.location = {
                        status: {
                            icon: "location_searching",
                            class: "off"
                        }
                    };
                    $scope.defaultFab = {
                        primary: {
                            clickAction: function() {
                                console.log("Primary clicked.");
                            },
                            classes: "",
                            icon: {
                                iconSet: "material-icons",
                                classes: "",
                                text: "add"
                            },
                            tooltip: {
                                direction: "left",
                                text: "Cancel"
                            }
                        },
                        secondary: [
                            {
                                clickAction: function() {
                                    console.log("Secondary 1 clicked.");
                                },
                                classes: "",
                                icon: {
                                    iconSet: "material-icons",
                                    classes: "",
                                    text: "place"
                                },
                                tooltip: {
                                    direction: "left",
                                    text: "New point"
                                }
                            },
                            {
                                clickAction: function() {
                                    console.log("Secondary 2 clicked.");
                                },
                                classes: "",
                                icon: {
                                    iconSet: "material-icons",
                                    classes: "",
                                    text: "timeline"
                                },
                                tooltip: {
                                    direction: "left",
                                    text: "New line"
                                }
                            },
                            {
                                clickAction: function() {
                                    console.log("Secondary 3 clicked.");
                                },
                                classes: "",
                                icon: {
                                    iconSet: "material-icons",
                                    classes: "",
                                    text: "select_all"
                                },
                                tooltip: {
                                    direction: "left",
                                    text: "New polygon"
                                }
                            }
                        ],
                        options: {
                            isOpen: false,
                            tooltipsVisible: false,
                            direction: "up",
                            location: "md-fab-bottom-right"
                        }
                    };
                    
                    $scope.fab = {
                        update: function(primary, secondary, options) {
                            this.primary = angular.copy(primary);
                            if (secondary) {
                                this.secondary = angular.copy(secondary);
                            } else if (this.secondary) {
                                delete this.secondary;
                            }
                            this.options = angular.copy(options);
                        },
                        unset: function() {
                            this.primary = angular.copy($scope.defaultFab.primary);
                            this.secondary = $scope.defaultFab.secondary ? angular.copy($scope.defaultFab.secondary) : undefined;
                            this.options = angular.copy($scope.defaultFab.options);
                        }
                    };

                    $scope.$watch('fab.options.isOpen', function(isOpen) {
                        if (isOpen) {
                            $scope.showTooltips = $timeout(function() {
                                $scope.fab.options.tooltipsVisible = $scope.fab.options.isOpen;
                                $scope.hideTooltips = $timeout(function() {
                                    $scope.fab.options.tooltipsVisible = false;
                                }, 2500);
                            }, 500);
                        } else {
                            $timeout.cancel($scope.showTooltips);
                            $timeout.cancel($scope.hideTooltips);
                            $scope.fab.options.tooltipsVisible = $scope.fab.options.isOpen;
                        }
                    });

                    $scope.$on('scope_loaded', function() {
                        $scope.fab.unset();
                    });

                    $rootScope.$on('$viewContentLoaded', function() {
                        angular.element("#loading-logo").remove();
                    });

                    $timeout(function() {
                        $("#loading-logo").remove();
                    }, 100);

                    $scope.swipeOverlayStatus = false;

                    $rootScope.$on('geolocation.started', function(){
                        $scope.location.status.icon = "my_location";
                        $scope.location.status.class = "searching";
                    });

                    $rootScope.$on('geolocation.updated', function(){
                        $scope.location.status.icon = "my_location";
                        $scope.location.status.class = "on";
                    });

                    $rootScope.$on('geolocation.stopped', function(){
                        $scope.location.status.icon = "location_searching";
                        $scope.location.status.class = "off";
                    });

                    $rootScope.$on('geolocation.failed', function(){
                        $scope.location.status.icon = "location_disabled";
                        $scope.location.status.class = "off";
                    });

                    $scope.openBottomSheet = function(panel) {
                        $scope.closeLeftSidenav();
                        Core.setMainPanel(panel);
                        $mdBottomSheet.show({
                            templateUrl: hsl_path + 'components/layout/partials/bottom-sheet.html?bust=' + gitsha,
                            scope: $scope,
                            parent: "#layout",
                            preserveScope: true,
                            disableBackdrop: true,
                            // disableParentScroll: false,
                            clickOutsideToClose: true
                        }).then(function() {
                            console.log("Bottom sheet closed", Date.now());
                        }).catch(function() {
                            console.log("Bottom sheet canceled", Date.now());
                        });
                    }

                    $scope.closeBottomSheet = function() {
                        $mdBottomSheet.hide();
                    }

                    $scope.openLeftSidenav = function() {
                        $mdSidenav('sidenav-left').open()
                        .then(function() {
                            $scope.swipeOverlayStatus = true;
                        });
                    }

                    $scope.closeLeftSidenav = function() {
                        $mdSidenav('sidenav-left').close();
                    }

                    $mdSidenav('sidenav-left', true).then(function(){
                        $mdSidenav('sidenav-left').onClose(function() {
                            $scope.swipeOverlayStatus = false;
                        });

                        Hammer(document.getElementsByClassName("md-sidenav-left")[0]).on("swipeleft", () => {
                            $scope.closeLeftSidenav();
                        });

                        Hammer(document.getElementById("sidenav-swipe-overlay")).on("swiperight", () => {
                            $scope.openLeftSidenav();
                        });
                    });

                    function BaselayersPanelProviderConfig($mdPanelProvider) {
                        $mdPanelProvider.definePreset('demoPreset', {
                            attachTo: angular.element("#gui"),
                            controller: "hs.layout.controller",
                            templateUrl: hsl_path + 'components/layout/partials/baselayers.html?bust=' + gitsha,
                            zIndex: 100
                        });
                    }

                    $scope.$emit('scope_loaded', "Layout");
                }

            ])

            .service('hs.layout.service', ['$scope', '$window', 'Core', 'hs.map.service', 'gettextCatalog', 'config', '$templateCache', '$timeout', '$interval', '$mdSidenav', '$mdMenu',
                function($scope, $window, Core, OlMap, gettextCatalog, config, $templateCache, $timeout, $interval, $mdSidenav, $mdMenu) {
                    
                }
            ]);
    })
