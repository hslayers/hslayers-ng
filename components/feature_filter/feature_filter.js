/**
* @namespace hs.feature_filter
* @memberOf hs
* @desc Module is used to filter certain features on vector layers based on attribute values.
* It also draws nice charts with bars proportionaly to usage of each value of a particular attribute.
*
* must provide layers to be fillterable in app.js parametrs:
*      module.value('crossfilterable_layers', [{
        layer_ix: 1,
        attributes: ["http://gis.zcu.cz/poi#category_osm"]
    }]);
*/
define(['angular', 'ol', 'angular-material', 'map', 'core', 'layermanager'],

    function(angular, ol) {
        var module = angular.module('hs.feature_filter', ['hs.map', 'hs.core', 'ngMaterial', 'hs.layermanager'])

            /**
            * @memberof hs.feature_filter
            * @ngdoc directive
            * @name hs.featureFilter.directive
            * @description TODO
            */
            .directive('hs.featureFilter.directive', ['config', function(config) {
                return {
                    templateUrl: `${config.hsl_path}components/feature_filter/partials/feature_filter${config.design || ''}.html`,
                    link: function(scope, element) {

                    }
                };
            }])

            /**
            * @memberof hs.feature_list
            * @ngdoc directive
            * @name hs.featureList.directive
            * @description TODO
            */
            .directive('hs.featureList.directive', ['config', function(config) {
                return {
                    replace: true,
                    templateUrl: `${config.hsl_path}components/feature_filter/partials/feature_list${config.design || ''}.html`,
                    link: function(scope, element) {

                    }
                };
            }])

            /**
            * @memberof hs.feature_filter
            * @ngdoc directive
            * @name hs.featureFilter.element.directive
            * @description TODO
            */
            .directive('hs.featureFilter.element.directive', ['config', '$compile', function(config, $compile) {
                return {
                    // templateUrl: `${config.hsl_path}components/feature_filter/partials/${$state.type}${config.design || ''}.html`,
                    template: '<ng-include src="getTemplateUrl()"/>',
                    scope: {
                        filter: "="
                    },
                    // link: function(scope, element, attrs) {
                    //     element.html(`${hsl_path}components/feature_filter/partials/${scope.filter.type}${config.design || ''}.html`).show();
                    //     $compile(element.contents())(scope);
                    // },
                    controller: function($scope) {
                        $scope.getTemplateUrl = function() {
                            return `${config.hsl_path}components/feature_filter/partials/${$scope.filter.type}${config.design || ''}.html`;
                        };
                    },
                    // templateUrl: function(el, attrs) {
                    //     return `${config.hsl_path}components/feature_filter/partials/${attrs.filter.type}md.html`
                    // },
                    // link: function(scope, element, attrs) {
                    //     scope.filter = scope.$eval(attrs.filter);
                    // },
                    // templateUrl: config.hsl_path + 'components/feature_filter/partials/{{filter.type}}md.html',
                };
            }])

            /**
            * @memberof hs.feature_filter
            * @ngdoc service
            * @name hs.featureFilter.service
            * @description TODO
            */
            .service('hs.feature_filter.service', ['$rootScope', 'hs.map.service', 'hs.layermanager.service', 'Core', 'hs.utils.service', 'config', function ($rootScope, OlMap, LayMan, Core, utils, config) {
                var me = {
                    applyFilters: function(layer) {
                        if (!layer) {
                            if (LayMan.currentLayer === undefined) return;
                            layer = LayMan.currentLayer;
                        }

                        var source = layer.layer.getSource();

                        if (!('hsFilters' in layer)) return source.getFeatures();
                        if (!layer.hsFilters) return source.getFeatures();

                        var filters = layer.hsFilters;
                        var filteredFeatures = source.getFeatures();

                        source.forEachFeature(function (feature) {
                            feature.setStyle(null);
                        });

                        for (var i in filters) {
                            var filter = filters[i];
                            var displayFeature;

                            switch (filter.type.type) {
                                case 'fieldset':
                                    // if (filter.selected.length === 0) {
                                    //     displayFeature = function (feature, filter) {
                                    //         return true;
                                    //     };
                                    //     break;
                                    // }
                                    displayFeature = function (feature) {
                                        return filter.selected.indexOf(feature.getProperties()[filter.valueField]) !== -1;
                                    };
                                    break;
                                case 'slider':
                                    switch (filter.type.parameters) {
                                        case 'lt':
                                            displayFeature = function (feature) {
                                                return feature.getProperties()[filter.valueField] < filter.value;
                                            };
                                            break;
                                        case 'le':
                                            displayFeature = function (feature) {
                                                return feature.getProperties()[filter.valueField] <= filter.value;
                                            };
                                            break;
                                        case 'gt':
                                            displayFeature = function (feature) {
                                                return feature.getProperties()[filter.valueField] > filter.value;
                                            };
                                            break;
                                        case 'ge':
                                            displayFeature = function (feature) {
                                                return feature.getProperties()[filter.valueField] >= filter.value;
                                            };
                                            break;
                                        case 'eq':
                                            displayFeature = function (feature) {
                                                return feature.getProperties()[filter.valueField] === filter.value;
                                            };
                                            break;
                                    }
                                default:
                                    displayFeature = function (feature) {
                                        return true;
                                    };
                            }
							
							filteredFeatures = filteredFeatures.filter(displayFeature);

                            source.forEachFeature(function(feature) {
                                if (!displayFeature(feature, filter)) {
                                    feature.setStyle(new ol.style.Style({}));
								}
                            });
                        }

                        layer.filteredFeatures = filteredFeatures;
                        if (!$rootScope.$$phase) $rootScope.$digest();
                        return filteredFeatures;
                    },

                    prepLayerFilter: function(layer) {
                        if ('hsFilters' in layer) {
                            for (var i in layer.hsFilters) {
                                var filter = layer.hsFilters[i];

                                if (filter.gatherValues) {
                                    switch (filter.type.type) {
                                        case 'fieldset': case 'dictionary':
                                            var source = layer.layer.getSource();
                                            source.forEachFeature(function (feature) {
                                                if (filter.values.indexOf(feature.getProperties()[filter.valueField]) === -1) {
                                                    filter.values.push(feature.getProperties()[filter.valueField]);
                                                }
                                            });

                                            filter.values.sort(function(a, b) {
                                                return (a.replace("the ","").replace("The ","") > b.replace("the ","").replace("The ","")) * 2 - 1;
                                            });

                                            break;
                                        case 'dateExtent':
                                            // // TODO: create time range from date extents of the features, convert datetime fields to datetime datatype
                                            // if (filter.range === undefined) filter.range = [];

                                            // var source = layer.layer.getSource();
                                            // source.forEachFeature(function (feature) {
                                            //     if (feature.getProperties()[filter.valueField] < filter.range[0] || filter.range[0] === undefined) {
                                            //         filter.range[0] = feature.getProperties()[filter.valueField];
                                            //     }
                                            //     if (feature.getProperties()[filter.valueField] > filter.range[1] || filter.range[1] === undefined) {
                                            //         filter.range[1] = feature.getProperties()[filter.valueField];
                                            //     }
                                            // });
                                            break;
                                    }
                                }

                                if (filter.type.type === "fieldset" && filter.selected === undefined && filter.values.length > 0) {
                                    filter.selected = filter.values.slice(0);
                                }
                            }
                        }
                    },

                    getFeatureByUri: function(features, uri, uriname){
                      var selected;
                      features.forEach((feature, i) => {
                        if (feature.getProperties()[uriname] == uri){
                          selected = feature;
                        }
                      });

                      $rootScope.$broadcast('map.selectedFeatureDetected', selected);
                    }
                };

                $rootScope.$on('layermanager.layer_added', function (e, layer) {
                    me.prepLayerFilter(layer);

                    if (layer.layer instanceof ol.layer.Vector) {
                        var source = layer.layer.getSource();
                        var listenerKey = source.on('change', function (e) {
                            if (source.getState() === 'ready') {
                                ol.Observable.unByKey(listenerKey);
                                me.prepLayerFilter(layer);
                                me.applyFilters(layer);
                                if ($rootScope.uri && $rootScope.uri != 'none') {
                                  me.getFeatureByUri(layer.filteredFeatures, $rootScope.uri, layer.featureURI);
                                }

                            }
                        });
                    }



                });


                return me;
            }])

            /**
            * @memberof hs.feature_filter
            * @ngdoc controller
            * @name hs.featureFilter.controller
            * @description TODO
            */
            .controller('hs.feature_filter.controller', ['$scope', 'hs.map.service', 'Core', 'hs.feature_filter.service', 'hs.layermanager.service', 'config', '$mdPanel',
                function($scope, OlMap, Core, service, LayMan, config, $mdPanel) {
                    $scope.map = OlMap.map;
                    $scope.LayMan = LayMan;

                    $scope.applyFilters = service.applyFilters;

                    $scope.allSelected = function(filter) {
                        return filter.selected ? filter.selected.length === filter.values.length : false;
                    };

                    $scope.isIndeterminate = function(filter) {
                        return filter.selected ? (filter.selected.length !== 0 && filter.selected.length !== filter.values.length) : false;
                    };

                    $scope.exists = function(item, list) {
                        return list.indexOf(item) > -1;
                    };

                    $scope.toggle = function(value, selected) {
                        var idx = selected.indexOf(value);
                        if (idx > -1) {
                            selected.splice(idx, 1);
                        } else {
                            selected.push(value);
                        }
                        $scope.applyFilters();
                    };

                    $scope.toggleAll = function(filter) {
                        if (filter.selected.length === filter.values.length) {
                            filter.selected = [];
                        } else {
                            filter.selected = filter.values.slice(0);
                        }
                        $scope.applyFilters();
                    };

					$scope.filterChanged = function(filter) {
						switch (filter.type.type) {
							case 'fieldset': case 'dictionary':
								return !$scope.allSelected(filter);
						}
					};

					$scope.resetFilter = function(ev, filter) {
						ev.stopPropagation();
						switch (filter.type.type) {
							case 'fieldset': case 'dictionary':
								filter.selected = filter.values.slice(0);
								break;
						}
						$scope.applyFilters();
					};

					$scope.showFilter = function(ev, filter) {
                        let panelPosition = $mdPanel.newPanelPosition()
                            .relativeTo(ev.target)
                            .addPanelPosition(
								$mdPanel.xPosition.ALIGN_START,
								$mdPanel.yPosition.BELOW
                            );
                        let panelAnimation = $mdPanel.newPanelAnimation()
                            .openFrom(ev.target)
                            .closeTo(ev.target)
                            // .targetEvent($event)
                            // .defaultAnimation('md-panel-animate-fly')
                            // .withAnimation($mdPanel.animation.SLIDE);
                            .withAnimation($mdPanel.animation.FADE);
                        let panelConfig = {
                            attachTo: angular.element('body'),
                            position: panelPosition,
                            animation: panelAnimation,
                            targetEvent: ev,
                            templateUrl: `${config.hsl_path}components/feature_filter/partials/${filter.type.type}_filtermd.html`,
                            panelClass: 'filter-panel md-whiteframe-8dp',
                            scope: this,
                            trapFocus: true,
                            clickOutsideToClose: true,
                            clickEscapeToClose: true,
                            zIndex: 50
                        };

						$scope.selectedFilter = filter;

                        $mdPanel.open(panelConfig)
                            .then(function (result) {
                                $scope.filterPanelRef = result;
                            });

                        $scope.closeFilter = function (MdPanelRef) {
                            if (MdPanelRef) MdPanelRef.close();
                        };
                    };

                    $scope.$emit('scope_loaded', "featureFilter");



                    // $rootScope.$on('layermanager.layer_added', function (e, layer) {
                    //     service.prepLayerFilter(layer);

                    //     if (layer.layer instanceof ol.layer.Vector) {
                    //         var source = layer.layer.getSource();
                    //         console.log(source.getState());
                    //         var listenerKey = source.on('change', function (e) {
                    //             if (source.getState() === 'ready') {
                    //                 console.log(source.getState());
                    //                 ol.Observable.unByKey(listenerKey);
                    //                 service.prepLayerFilter(layer);
                    //                 $scope.applyFilters(layer);
                    //             }
                    //         });
                    //     }
                    // });
                }
            ])

            /**
            * @memberof hs.feature_filter
            * @ngdoc controller
            * @name hs.featureList.controller
            * @description TODO
            */
            .controller('hs.feature_list.controller', ['$scope', '$timeout', 'hs.map.service', 'Core', 'hs.feature_filter.service', 'hs.layermanager.service', 'config', '$rootScope',
                function($scope, $timeout, OlMap, Core, service, LayMan, config, $rootScope, feature_filter, map) {
                    const POPUP = new ol.Overlay.Popup();

                    if (OlMap.map)
                        OlMap.map.addOverlay(POPUP);
                    else
                        $rootScope.$on('map.loaded', function () {
                            OlMap.map.addOverlay(POPUP);
                        });

					window.scope = $scope;
					$scope.reverseOrdering = false;
					$scope.orderProperty = 'position';
					$scope.defaultOrder = 'bp_id';

					$scope.orderProperties = [`values_.${$scope.orderProperty}`, `values_.${$scope.defaultOrder}`];

					$scope.sortBy = function(property) {
						$scope.reverseOrdering = $scope.orderProperty === property ? !$scope.reverseOrdering : false;
						$scope.orderProperties[0] = `${$scope.reverseOrdering ? '-' : ''}values_.${property}`;
					};

                    $scope.map = OlMap.map;
                    $scope.LayMan = LayMan;

                    $scope.applyFilters = service.applyFilters;
                    $scope.displayDetails = false;
                    $scope.selectedFeatures = new ol.Collection();

                    $scope.highlightedStyle = new ol.style.Style({
                        image: new ol.style.Icon(({
                            crossOrigin: 'anonymous',
                            src: 'enabling_logo_2_relief11_stin.png',
                            anchor: [0.5, 0.5],
                            scale: 0.5,
                        }))
                    });

                    $scope.highlightFeature = function(feature, displayPopup=false) {
                        feature.setProperties({
                            class: "highlighted"
                        });
                        feature.setStyle($scope.highlightedStyle);

                        if (displayPopup) {
                            const COORDS = feature.getProperties().geometry.flatCoordinates;
                            POPUP.show(COORDS, feature.getProperties().name);
                        }
                    }


                    $scope.unhighlightFeature = function(feature, displayPopup=false) {
                        feature.setProperties({
                            class: ""
                        });
                        feature.setStyle(null);
                        if (displayPopup) {
                            POPUP.hide();
                        }
                    }

                    $scope.highlighter = new ol.interaction.Select({
                        condition: ol.events.condition.pointerMove,
                        style: $scope.highlightedStyle,
                        filter: function(feature) {
                            return feature !== $scope.selectedFeature
                        },
                    });

                    $scope.map.addInteraction($scope.highlighter);
                    $scope.highlighter.on('select', function(e) {
                        if (e.selected.length > 0) $scope.highlightFeature(e.selected[0], true);
                        if (e.deselected.length > 0) $scope.unhighlightFeature(e.deselected[0], e.selected.length === 0);
                        if (!$scope.$$phase) $scope.$digest();
                    });

                    $scope.selector = new ol.interaction.Select({
                        condition: ol.events.condition.click,
                        toggleCondition: ol.events.condition.never,
                        style: $scope.highlightedStyle,
                        features: $scope.selectedFeatures
                    });

                    $scope.map.addInteraction($scope.selector);

                    $scope.selector.on('select', function(e) {
                        let feature = e.target.getFeatures().array_[0];

                        $scope.toggleFeatureDetails(feature, false);

                        if (!$scope.$$phase) $scope.$digest();
                    });

                    cancelLastView = function() {
                        $scope.moveToLastView = false;
                    }

                    $scope.toggleFeatureDetails = function(feature, handleFeature) {
                        Core.updateMapSize();
                        $scope.displayDetails = !$scope.displayDetails;
                        $scope.LayMan.currentLayer.selectedFeature = feature;

                        if (feature === undefined) {
                            $scope.displayDetails = false;
                        }

                        if ($scope.selectedFeature) {

                            if (feature && feature !== $scope.selectedFeature) $scope.displayDetails = true;

                            $scope.selectedFeature.setStyle(null);

                            // $scope.map.un('movestart', cancelLastView);
                        }

                        if ($scope.displayDetails) {
                            $scope.lastView = $scope.map.getView().getProperties();
                            $scope.moveToLastView = true;

                            $scope.featureDetails = feature.getProperties();
                            $scope.selectedFeature = feature;

                            var view = $scope.map.getView();
                            view.animate({
                                zoom: 7,
                                center: feature.getProperties().geometry.flatCoordinates,
                                duration: 300
                            });

                            // $timeout(function() {
                            //     $scope.map.on('movestart', cancelLastView);
                            // },350);

                            if (handleFeature) $scope.selectedFeatures.push(feature);
                        } else {
                            if (handleFeature) $scope.selectedFeatures.clear();
                            $scope.selectedFeature = undefined;

                            if ($scope.moveToLastView) {
                                $scope.map.getView().animate({
                                    resolution: $scope.lastView.resolution,
                                    center: $scope.lastView.center,
                                    duration: 300
                                });
                            }
                        }
                        $rootScope.$broadcast('map.selection_changed', feature);
                        if (!$scope.$$phase) $scope.$digest();
                        $rootScope.$broadcast('map.selection_changed', feature);
                        //$scope.LayMan.currentLayer.selectedFeature = $scope.selectedFeature;
                    };

                    $rootScope.$on('map.selectedFeatureDetected', function(e, f){
                      $scope.highlightFeature(f, true);
                      $scope.toggleFeatureDetails(f, false);
                    });

                    $scope.$emit('scope_loaded', "featureList");

                    $timeout(function(){
                        Core.updateMapSize();
                    },1000);
                }
            ]);

    });
