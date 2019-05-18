/**
 * @namespace hs.layout
 * @memberOf hs
 */
define(['angular', 'angular-material', 'core', 'map', 'geolocation', 'layermanager'],

    function (angular) {
        // 'material.components.bottomSheetCollapsible'
        angular.module('hs.layout', ['hs.core', 'hs.map', 'ngMaterial', 'hs.geolocation', 'hs.layermanager', 'hs.print'])
            /**
            * @memberof hs.mdLayout
            * @ngdoc directive
            * @name hs.mdLayout.directive
            * @description TODO
            */
            .directive('hs.layout.directive', ['hs.map.service', 'Core', '$timeout', 'config', '$compile',
                function (OlMap, Core, $timeout, config, $compile) {
                    return {
                        templateUrl: config.layout_template || `${config.hsl_path}components/layout/partials/layout${config.design || ''}.html`,
                        link: function (scope, element) {
                            try {
                                if (angular.module('hs.cesium')) {
                                    if (angular.element('.page-content', element)) {
                                        angular.element('.page-content', element).append($compile('<div hs.cesium.directive ng-controller="hs.cesium.controller"></div>')(scope));
                                    }
                                }
                            } catch (err) { /* failed to require */ }


                            Core.init(element, {
                                innerElement: '#map-container'
                            });

                            //Hack - flex map container was not initialized when map loaded 
                            var container = document.getElementById('map-container');
                            if(container){
                                if (container.clientHeight === 0) {
                                    containerCheck();
                                }
    
                                function containerCheck() {
                                    $timeout(function () {
                                        if (container.clientHeight != 0) scope.$emit("Core_sizeChanged");
                                        else containerCheck();
                                    }, 100);
                                }
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
            .directive('hs.mdSidenav.directive', ['config', function (config) {
                return {
                    templateUrl: config.sidenav_template || config.hsl_path + 'components/layout/partials/sidenav.html' 
                };
            }])

            /**
            * @memberof hs.mdRightPanel
            * @ngdoc directive
            * @name hs.mdRightPanel.directive
            * @description TODO
            */
            .directive('hs.mdRightPanel.directive', ['config', function (config) {
                return {
                    replace: true,
                    templateUrl: config.right_panel_template || config.hsl_path + 'components/layout/partials/right-panel.html'
                };
            }])

            /**
            * @memberof hs.mdToolbar
            * @ngdoc directive
            * @name hs.mdToolbar.directive
            * @description TODO
            */
            .directive('hs.mdToolbar.directive', ['config', function (config) {
                return {
                    templateUrl: config.toolbar_template || config.hsl_path + 'components/layout/partials/toolbar.html'
                };
            }])

            .directive('hs.mdOverlay.directive', ['config', function (config) {
                return {
                    templateUrl: config.overlay_template || config.hsl_path + 'components/layout/partials/overlay.html',
                    link: (scope, element, attrs) => {
                        element.css("height", element.parent().css("height"));
                        scope.$watch(() => element.parent().css("height"), () => {
                            element.css("height", element.parent().css("height"));
                        });
                    }
                };
            }])

            .directive('hs.swipeArea.directive', ['config', function (config) {
                return {
                    templateUrl: config.hsl_path + 'components/layout/partials/swipe-area.html'
                };
            }])

            .directive('hs.bottomSheetScroll', function () {
                return {
                    restrict: 'A',
                    link: function (scope, element, attrs) {
                        let raw = element[0];
                        function resolveScrollPosition() {
                            if (raw.classList.value.indexOf("expanded") + 1 && raw.scrollHeight > raw.clientHeight) {
                                raw.style["touch-action"] = "pan-y";
                                if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
                                    raw.style["touch-action"] = "pan-up";
                                }
                                if (raw.scrollTop == 0) {
                                    raw.style["touch-action"] = "pan-down";
                                }
                            } else {
                                raw.style["touch-action"] = "none";
                            }
                        }
                        scope.$watch(() => raw.scrollHeight,
                            () => {
                                resolveScrollPosition();
                            });
                        scope.$watch(() => raw.classList.value,
                            () => {
                                resolveScrollPosition();
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
            .controller('hs.layout.controller', ['$scope', '$injector', '$rootScope', '$window', 'Core', 'hs.map.service', 'hs.geolocation.service', 'hs.layermanager.service', 'gettextCatalog', 'config', '$templateCache', '$timeout', '$interval', '$mdSidenav', '$mdMenu', '$mdPanel', '$mdDialog', '$mdMedia', 'hs.layout.service',
                function ($scope, $injector, $rootScope, $window, Core, OlMap, Geolocation, LayerManager, gettextCatalog, config, $templateCache, $timeout, $interval, $mdSidenav, $mdMenu, $mdPanel, $mdDialog, $mdMedia, layoutService) {
                    if(config.design == 'md')
                        window.require(['bottomSheetCollapsible']);
                    $scope.importCss = angular.isDefined(config.importCss) ? config.importCss : true;
                    $scope.useIsolatedBootstrap = angular.isDefined(config.useIsolatedBootstrap) ? config.useIsolatedBootstrap : false;
                    $scope.Core = Core;
                    $scope.geolocation = Geolocation;
                    $scope.LM = LayerManager;
                    $scope.layoutService = layoutService;

                    $scope.location = {
                        status: {
                            icon: "location_searching",
                            class: "off"
                        }
                    };
                    $scope.defaultFab = {
                        primary: {
                            clickAction: function () {
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
                                clickAction: function () {
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
                                clickAction: function () {
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
                                clickAction: function () {
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
                        update: function (primary, secondary, options) {
                            this.primary = angular.copy(primary);
                            if (secondary) {
                                this.secondary = angular.copy(secondary);
                            } else if (this.secondary) {
                                delete this.secondary;
                            }
                            this.options = angular.copy(options);
                        },
                        unset: function () {
                            this.primary = angular.copy($scope.defaultFab.primary);
                            this.secondary = $scope.defaultFab.secondary ? angular.copy($scope.defaultFab.secondary) : undefined;
                            this.options = angular.copy($scope.defaultFab.options);
                        }
                    };

                    $scope.$watch('fab.options.isOpen', function (isOpen) {
                        if (isOpen) {
                            $scope.showTooltips = $timeout(function () {
                                $scope.fab.options.tooltipsVisible = $scope.fab.options.isOpen;
                                $scope.hideTooltips = $timeout(function () {
                                    $scope.fab.options.tooltipsVisible = false;
                                }, 2500);
                            }, 500);
                        } else {
                            $timeout.cancel($scope.showTooltips);
                            $timeout.cancel($scope.hideTooltips);
                            $scope.fab.options.tooltipsVisible = $scope.fab.options.isOpen;
                        }
                    });

                    $scope.$on('scope_loaded', function () {
                        $scope.fab.unset();
                    });

                    function removeLoadingLogo(){
                        var el = document.getElementById('hs-loading-logo');
                        if(el) {
                            el.parentElement.removeChild(el);
                        }
                    }

                    $rootScope.$on('$viewContentLoaded', removeLoadingLogo);
                    $timeout(removeLoadingLogo, 100);

                    $scope.leftSidenavOpen = false;

                    $rootScope.$on('geolocation.started', function () {
                        $scope.location.status.icon = "my_location";
                        $scope.location.status.class = "searching";
                    });

                    $rootScope.$on('geolocation.updated', function () {
                        $scope.location.status.icon = "my_location";
                        $scope.location.status.class = "on";
                    });

                    $rootScope.$on('geolocation.stopped', function () {
                        $scope.location.status.icon = "location_searching";
                        $scope.location.status.class = "off";
                    });

                    $rootScope.$on('geolocation.failed', function () {
                        $scope.location.status.icon = "location_disabled";
                        $scope.location.status.class = "off";
                    });

                    $scope.openPanel = function (panel) {
                        Core.setMainPanel(panel.name);
                        $scope.bottomSheetTitle = panel.title;
                        if (!$mdMedia('gt-sm') && !$scope.getBottomSheetState) {
                            $scope.closeLeftSidenav();
                            $scope.openBottomSheet(panel);
                        }
                    }

                    $scope.switchBottomSheetState = function () {
                        if ($scope.getBottomSheetState() === "minimized") {
                            $scope.setHalfway();
                        } else {
                            $scope.setMinimized();
                        }
                    }

                    // $scope.bottomSheetState = "halfway";
                    // $scope.bottomSheetSwitchStateIcon = "expand_more";

                    function resolveScrollPosition(raw) {
                        if ($scope.getBottomSheetState === "expanded" && raw.scrollHeight > raw.clientHeight) {
                            raw.style["touch-action"] = "pan-y";
                            if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
                                raw.style["touch-action"] = "pan-up";
                            }
                            if (raw.scrollTop == 0) {
                                raw.style["touch-action"] = "pan-down";
                            }
                        } else {
                            raw.style["touch-action"] = "none";
                        }
                    }

                    $scope.openBottomSheet = function (panel) {
                        try{
                            var $mdBottomSheetCollapsible = $injector.get('$mdBottomSheetCollapsible');
                            $mdBottomSheetCollapsible.show({
                                templateUrl: config.hsl_path + 'components/layout/partials/bottom-sheet.html',
                                scope: $scope,
                                parent: "#layout",
                                preserveScope: true,
                                disableBackdrop: true,
                                // disableParentScroll: false,
                                clickOutsideToClose: true,
                                onLoad: function (e) {
                                    $scope.setMinimized = e.setMinimized;
                                    $scope.setHalfway = e.setHalfway;
                                    $scope.setExpanded = e.setExpanded;
                                    $scope.getBottomSheetState = e.getState;
                                    $scope.bottomSheet = e.element;
                                    // () => {
                                    //     var raw = $scope.bottomSheet;
                                    //     $scope.$watch(() => raw.scrollHeight,
                                    //         resolveScrollPosition(raw));
                                    //     $scope.$watch(() => $scope.getBottomSheetState(), resolveScrollPosition(raw));
                                    //     element.bind('scroll', function () {
                                    //         raw.style["touch-action"] = "pan-y";
                                    //         if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
                                    //             raw.style["touch-action"] = "pan-up";
                                    //         }
                                    //         if (raw.scrollTop == 0) {
                                    //             raw.style["touch-action"] = "pan-down";
                                    //         }
                                    //     })
                                    // }
                                }
                            }).then(function (e) {
                                console.log("Bottom sheet closed", Date.now());
                                $scope.unsetBottomSheet();
                            }).catch(function (e) {
                                console.log("Bottom sheet canceled", Date.now());
                                $scope.unsetBottomSheet();
                            });
                        }catch(e){
                            console.log('Injector does not have mdBottomSheetCollapsible service!');
                        }
                        
                        // $scope.$watch(function() {
                        //     return $scope.getBottomSheetState();
                        // }, function() {
                        //     $scope.bottomSheetSwitchStateIcon = $scope.getBottomSheetState === "minimized" ? "expand_less" : "expand_more";
                        // });
                    }

                    $scope.closeBottomSheet = function () {
                        $scope.bottomSheet.hide();
                        $scope.unsetBottomSheet();
                    }

                    $scope.unsetBottomSheet = function () {
                        $scope.setMinimized = undefined;
                        $scope.setHalfway = undefined;
                        $scope.setExpanded = undefined;
                        $scope.getBottomSheetState = undefined;
                        $scope.bottomSheet = undefined;
                    }

                    $scope.openLeftSidenav = function () {
                        $mdSidenav('sidenav-left').open()
                            .then(function () {
                                $scope.leftSidenavOpen = true;
                            });
                    }

                    $scope.closeLeftSidenav = function () {
                        $mdSidenav('sidenav-left').close();
                    }

                    $mdSidenav('sidenav-left', true).then(function () {
                        $mdSidenav('sidenav-left').onClose(function () {
                            $scope.leftSidenavOpen = false;
                        });

                        Hammer(document.getElementsByClassName("md-sidenav-left")[0]).on("swipeleft", () => {
                            $scope.closeLeftSidenav();
                        });

                        Hammer(document.getElementById("sidenav-swipe-overlay")).on("swiperight", () => {
                            $scope.openLeftSidenav();
                        });
                    });

                    $scope.openRightPanel = function () {
                        $mdSidenav('right-panel').open()
                            .then(function () {
                                $scope.rightPanelOpen = true;
                            });
                    }

                    $scope.closeRightPanel = function () {
                        $mdSidenav('right-panel').close();
                    }

                    $mdSidenav('right-panel', true).then(function () {
                        $mdSidenav('right-panel').onClose(function () {
                            $scope.rightPanelOpen = false;
                        });
                    });

                    $scope.defaultBaselayerThumbnail = `${hsl_path}components/layout/osm.png`;
                    $scope.defaultTerrainlayerThumbnail = `${hsl_path}components/layout/osm.png`;

                    let baselayersPanelRef;

                    $scope.removeLayer = function (layer) {
                        var active = layer.active;
                        OlMap.map.removeLayer(layer.layer);
                        if (active) {
                            if (LM.data.baselayers.length > 0) LM.changeBaseLayerVisibility(true, LM.data.baselayers[0]);
                        }
                    }

                    $scope.hasImage = function (layer) {
                        return angular.isDefined(layer.layer.get('img')) ? true : false;
                    }

                    $scope.getImage = function (layer) {
                        return layer.layer.get('img');
                    }

                    $scope.isRemovable = function (layer) {
                        return layer.layer.get('removable');
                    }

                    $scope.showRemoveDialog = function (e, layer) {
                        var confirm = $mdDialog.confirm()
                            .title('Remove basemap ' + layer.title)
                            .textContent('Are you sure about layer removal?')
                            .ariaLabel('Confirm layer removal')
                            .targetEvent(e)
                            .ok('Remove')
                            .cancel('Cancel')
                            .hasBackdrop(false);

                        $mdDialog.show(confirm).then(function () {
                            $scope.removeLayer(layer);
                        }, function () {
                        });
                    }

                    $scope.openBaselayersPanel = function ($event) {
                        let panelPosition = $mdPanel.newPanelPosition()
                            // .relativeTo($event.srcElement)
                            .relativeTo($event.target)
                            .addPanelPosition(
                            $mdPanel.xPosition.ALIGN_END,
                            $mdPanel.yPosition.ALIGN_TOPS
                            )
                            .addPanelPosition(
                            $mdPanel.xPosition.ALIGN_START,
                            $mdPanel.yPosition.ALIGN_TOPS
                            )
                            .addPanelPosition(
                            $mdPanel.xPosition.ALIGN_END,
                            $mdPanel.yPosition.ALIGN_BOTTOMS
                            )
                            .addPanelPosition(
                            $mdPanel.xPosition.ALIGN_START,
                            $mdPanel.yPosition.ALIGN_BOTTOMS
                            );
                        let panelAnimation = $mdPanel.newPanelAnimation()
                            .openFrom($event.target)
                            .closeTo($event.target)
                            // .targetEvent($event)
                            // .defaultAnimation('md-panel-animate-fly')
                            .withAnimation($mdPanel.animation.SCALE);
                        let config = {
                            attachTo: angular.element("#gui"),
                            position: panelPosition,
                            animation: panelAnimation,
                            targetEvent: $event,
                            templateUrl: `${config.hsl_path}components/layout/partials/baselayers.html`,
                            panelClass: 'baselayers-panel md-whiteframe-8dp',
                            scope: this,
                            trapFocus: true,
                            clickOutsideToClose: true,
                            clickEscapeToClose: true,
                            zIndex: 50
                        }

                        $mdPanel.open(config)
                            .then(function (result) {
                                baselayersPanelRef = result;
                            });

                        $scope.closeBaselayersPanel = function (MdPanelRef) {
                            if (MdPanelRef) MdPanelRef.close();
                        }
                    }

                    $scope.onlyEnabled = function (item) {
                        return item.enabled;
                    };
                    console.log(config);

                    $scope.defaultView = function(){
                        console.log(config.default_view.options_.center[0],config.default_view.options_.center[1]);
                        OlMap.map.getView().animate({
                            center: [config.default_view.options_.center[0], config.default_view.options_.center[1]],
                            zoom: config.default_view.options_.zoom
                        });
                        console.log(OlMap.map.getView())

                    };
                    $scope.maxView = function(){

                        var extent = ol.extent.createEmpty();
                        LayerManager.data.layers.forEach(function(layer) {
                        console.log(layer);
                        ol.extent.extend(extent, layer.layer.getSource().getExtent());
                        });
                        let appwidth = ($('.ol-unselectable').width());
                        appwidth = appwidth*0.45;
                        console.log(OlMap.map.getView())
                        console.log(OlMap.map.getSize());
                        OlMap.map.getView().fit(extent,{
                            padding: [0,appwidth,0,0]
                        });
                        console.log(OlMap.map.getView().calculateExtent(OlMap.map.getSize()))
                        // // OlMap.map.getView().fit(config.default_layers[1].getSource().getExtent(), OlMap.map.getSize());
                        console.log(OlMap.map.getView().getCenter())
                    };
                    
                    $scope.$emit('scope_loaded', "Layout");
                }

            ])

            .directive('panelCreator', ['$compile', '$parse', function ($compile, $parse) {
                return {
                    restrict: 'A',
                    terminal: true,
                    priority: 100000,
                    link: function (scope, elem) {
                        var name = $parse(elem.attr('panel-creator'))(scope);
                        elem.removeAttr('panel-creator');
                        var dirname = $parse(elem.attr('directive'))(scope);
                        if(name){
                            elem.attr('ng-controller', name);
                            elem.attr(dirname, '');
                            $compile(elem)(scope);
                        } else {
                            var html = angular.element('<' + dirname +'> </' + dirname +'>');
                            html.attr('ng-show', elem.attr('ng-show'));
                            elem.append($compile(html)(scope));
                        }              
                    }
                };
            }])

            .service('hs.layout.service', ['Core',
                function (Core) {
                    var me = this;

                    me.data = {
                        panels: [{
                            enabled: true,
                            order: 0,
                            title: 'Map Compositions',
                            description: 'List available map compositions',
                            name: 'composition_browser',
                            directive: 'hs.compositions.directive',
                            controller: 'hs.compositions.controller',
                            mdicon: 'map'
                        },
                        {
                            enabled: true,
                            order: 1,
                            title: 'Manage and Style Layers',
                            description: 'Manage and style your layers in composition',
                            name: 'layermanager',
                            directive: 'hs.layermanager.directive',
                            controller: 'hs.layermanager.controller',
                            mdicon: 'layers'
                        },
                        {
                            enabled: true,
                            order: 2,
                            title: 'Legend',
                            description: 'Display map legend',
                            name: 'legend',
                            directive: 'hs.legend',
                            mdicon: 'format_list_bulleted'
                        },
                        {
                            enabled: Core.singleDatasources,
                            order: 3,
                            title: !Core.singleDatasources ? 'Datasource Selector' : 'Add layers',
                            description: 'Select data or services for your map composition',
                            name: 'datasource_selector',
                            directive: 'hs.datasource_selector.directive',
                            controller: 'hs.datasource_selector.controller',
                            mdicon: 'dns'
                        },
                        {
                            enabled: !Core.singleDatasources,
                            order: 4,
                            title: 'Add external data',
                            description: 'Add external data',
                            name: 'ows',
                            directive: 'hs.ows.directive',
                            controller: 'hs.ows.controller',
                            mdicon: 'library_add'
                        },
                        {
                            enabled: true,
                            order: 5,
                            title: 'Measurements',
                            description: 'Measure distance or area at map',
                            name: 'measure',
                            directive: 'hs.measure.directive',
                            controller: 'hs.measure.controller',
                            mdicon: 'straighten'
                        },
                        {
                            enabled: true,
                            order: 6,
                            title: 'Print',
                            description: 'Print map',
                            name: 'print',
                            directive: 'hs.print',
                            mdicon: 'print'
                        },
                        {
                            enabled: true,
                            order: 7,
                            title: 'Share map',
                            description: 'Share map',
                            name: 'permalink',
                            directive: 'hs.permalink',
                            mdicon: 'share'
                        },
                        {
                            enabled: true,
                            order: 8,
                            title: 'Save composition',
                            ngClick() {Core.openStatusCreator() },
                            description: 'Save content of map to composition',
                            name: 'status_creator',
                            directive: 'hs.status_creator.directive_panel',
                            controller: 'hs.status_creator.controller',
                            mdicon: 'save'
                        }

                        ]
                    }
                    return me;
                }
            ]);
    })
