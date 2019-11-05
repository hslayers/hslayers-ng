export default ['$scope', '$injector', '$rootScope', '$window', 'Core', 'hs.map.service', 'hs.geolocation.service', 'hs.layermanager.service', 'gettextCatalog', 'config', '$templateCache', '$timeout', '$interval', 'hs.layout.service',
    function ($scope, $injector, $rootScope, $window, Core, OlMap, Geolocation, LayerManager, gettextCatalog, config, $templateCache, $timeout, $interval, layoutService) {
        if (config.design == 'md')
            require(['angular-material-bottom-sheet-collapsible/bottomSheetCollapsible']);
        $scope.importCss = angular.isDefined(config.importCss) ? config.importCss : true;
        $scope.useIsolatedBootstrap = angular.isDefined(config.useIsolatedBootstrap) ? config.useIsolatedBootstrap : false;
        $scope.Core = Core;
        $scope.geolocation = Geolocation;
        $scope.LM = LayerManager;
        $scope.layoutService = layoutService;
        $scope.panelVisible = layoutService.panelVisible;
        $scope.panelEnabled = layoutService.panelEnabled;

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

        function removeLoadingLogo() {
            var el = document.getElementById('hs-loading-logo');
            if (el) {
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

        var $mdMedia;
        try {
            $mdMedia = $injector.get('$mdMedia')
        } catch (ex) {

        }
        $scope.openPanel = function (panel) {
            layoutService.setMainPanel(panel.name);
            $scope.bottomSheetTitle = panel.title;
            if ($mdMedia && !$mdMedia('gt-sm') && !$scope.getBottomSheetState) {
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
            try {
                var $mdBottomSheetCollapsible = $injector.get('$mdBottomSheetCollapsible');
                $mdBottomSheetCollapsible.show({
                    template: require('components/layout/partials/bottom-sheet.html'),
                    scope: $scope,
                    parent: "#hs-layout",
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
            } catch (e) {
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
        if (config.design == "md") {
            try {
                var $mdSidenav = $injector.get('$mdSidenav');

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
                    var Hammer = require('hammerjs');
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
            } catch (ex) {
                console.error("$mdSidenav missing")
            }

            try {
                var $mdDialog = $injector.get('$mdDialog');

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
            } catch (ex) {

            }
        }



        $scope.defaultBaselayerThumbnail = require(`components/layout/osm.png`);
        $scope.defaultTerrainlayerThumbnail = require(`components/layout/osm.png`);

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

        try {
            var $mdPanel = $injector.get('$mdPanel');

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
                    template: require(`components/layout/partials/baselayers.html`),
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

        } catch (ex) {

        }

        $scope.panelSpaceWidth = layoutService.panelSpaceWidth;

        $scope.infoContainerStyle = function () {
            if (layoutService.sidebarBottom()){
                return {
                    width: layoutService.widthWithoutPanelSpace(),
                    bottom: layoutService.panelSpaceHeight() + 'px'
                }
            }
            else {
                if (!layoutService.sidebarRight)
                return {
                    marginLeft: layoutService.panelSpaceWidth() + 'px',
                    width: layoutService.widthWithoutPanelSpace()
                }
            else
                return {
                    marginRight: layoutService.panelSpaceWidth() + 'px',
                    width: layoutService.widthWithoutPanelSpace()
                }

            }
        }

        $scope.mapStyle = function () {
            let fullscreen = typeof config.sizeMode == 'undefined' || config.sizeMode == 'fullscreen';
            if (config.design == 'md') {
                console.log("md")
            }
            else if (layoutService.sidebarBottom()) {
                OlMap.map.updateSize()
                return {
                    height: document.getElementById('hs-app').clientHeight - layoutService.panelSpaceHeight() + 'px',
                    width: layoutService.panelSpaceWidth() + 'px',
                }
            }
            else {
                let height = fullscreen ? 100 + 'vh' : document.getElementById('hs-layout').clientHeight + 'px';
                if (!layoutService.sidebarRight)
                    return {
                        marginLeft: layoutService.panelSpaceWidth() + 'px',
                        width: layoutService.widthWithoutPanelSpace(),
                        height
                    }
                else
                    return {
                        marginLeft: '-px',
                        width: layoutService.widthWithoutPanelSpace(),
                        height
                    }
            }
        }

        $scope.onlyEnabled = function (item) {
            return item.enabled;
        };       

        $scope.$emit('scope_loaded', "Layout");
    }

]