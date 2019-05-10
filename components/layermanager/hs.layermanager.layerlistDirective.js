/**
 * @ngdoc module
 * @module hs.layermanager
 * @name hs.layermanager
 * @description Layer manager module maintain management of layers loaded in HS Layers application. It use folder structure to enable building hiearchy of layers. All layers are wrapped inside HSLayer object, which contain auxilary informations and layer itself.
 */

define(['angular', 'ol', 'hs.source.SparqlJson', 'angular-socialshare', 'map', 'ows_nonwms', 'config_parsers', 'hs.layermanager.WMSTservice'],

    function (angular, ol, SparqlJson, social) {
        return {
            init() {
                angular.module('hs.layermanager')
                    /**
                     * @module hs.layermanager
                     * @name hs.layermanager.layerlistDirective
                     * @ngdoc directive
                     * @description Directive for displaying list of layers in default HSLayers manager template. Every directive instance contain one folder of folder stucture. For every layer displays current information notes and on click opens layer options panel. Every directive instance is automatically refresh when layermanager.updated fires.
                     * Directive has access to contollers data object.
                     */
                    .directive('hs.layermanager.layerlistDirective', ['$compile', 'config', function ($compile, config) {
                        return {
                            template: require('components/layermanager/partials/layerlist.html'),
                            compile: function compile(element) {
                                var contents = element.contents().remove();
                                var contentsLinker;

                                return function (scope, iElement) {

                                    /**
                                    * @ngdoc property
                                    * @name hs.layermanager.layerlistDirective#layer_titles
                                    * @public
                                    * @type {Array} 
                                    * @description List of layer titles for current folder structure level. List is always ordered in order which should be used in template.
                                    */
                                    scope.layer_titles = [];

                                    /**
                                    * @ngdoc property
                                    * @name hs.layermanager.layerlistDirective#obj
                                    * @public
                                    * @type {Object} 
                                    * @description Container for folder object of current folder instance. Either full folders object or its subset based on hierarchy place of directive
                                    */
                                    if (scope.value == null) {
                                        scope.obj = scope.data.folders;
                                    } else {
                                        scope.obj = scope.value;
                                    }

                                    /**
                                     * @ngdoc method
                                     * @name hs.layermanager.layerlistDirective#filterLayers
                                     * @private
                                     * @description Filters layers, and returns only the ones belonging to folder hiearchy level of directive
                                     */
                                    function filterLayers() {
                                        var tmp = [];

                                        angular.forEach(scope.data.layers, function (layer) {
                                            if (layer.layer.get('path') == scope.obj.hsl_path || ((angular.isUndefined(layer.layer.get('path')) || layer.layer.get('path') == '') && scope.obj.hsl_path == '')) {
                                                tmp.push(layer);
                                            }
                                        })
                                        return tmp;
                                    }

                                    /**
                                    * @ngdoc property
                                    * @name hs.layermanager.layerlistDirective#filtered_layers
                                    * @public
                                    * @type {Array} 
                                    * @description List of layers which belong to folder hierarchy level of directive instance
                                    */
                                    scope.filtered_layers = filterLayers();

                                    /**
                                     * @ngdoc method
                                     * @name hs.layermanager.layerlistDirective#filtered_layers
                                     * @public
                                     * @description Generate list of layer titles out of {@link hs.layermanager.layerlistDirective#filtered_layers filtered_layers}. Complex layer objects cant be used because DragDropList functionality can handle only simple structures.
                                     */
                                    scope.generateLayerTitlesArray = function () {
                                        scope.layer_titles = [];
                                        for (var i = 0; i < scope.filtered_layers.length; i++) {
                                            scope.layer_titles.push(scope.filtered_layers[i].title);
                                        }
                                    }

                                    scope.$on('layermanager.updated', sortLayersByPosition);

                                    scope.order = function () {
                                        return config.layer_order || '-position';
                                    }

                                    /**
                                     * @ngdoc method
                                     * @name hs.layermanager.layerlistDirective#sortLayersByPosition
                                     * @private
                                     * @description Sort layers by computed position
                                     */
                                    function sortLayersByPosition() {
                                        scope.filtered_layers = filterLayers();
                                        var minus = scope.order().indexOf('-') == 0;
                                        var attribute = scope.order().replaceAll('-', '');
                                        scope.filtered_layers.sort(function (a, b) {
                                            var a = a.layer.get(attribute);
                                            var b = b.layer.get(attribute);
                                            var tmp = (a < b ? -1 : (a > b ? 1 : 0)) * (minus ? -1 : 1);
                                            return tmp;
                                        });
                                        scope.generateLayerTitlesArray();
                                    }

                                    sortLayersByPosition();

                                    if (angular.isUndefined(contentsLinker)) {
                                        contentsLinker = $compile(contents);
                                    }

                                    contentsLinker(scope, function (clonedElement) {
                                        iElement.append(clonedElement);
                                    });

                                    /**
                                     * @ngdoc method
                                     * @name hs.layermanager.layerlistDirective#dragged
                                     * @public
                                     * @description Callback for dragged event so event can be injected with correct layer titles list needed for correct recalculation.
                                     */
                                    scope.dragged = function (event, index, item, type, external) {
                                        scope.draggedCont(event, index, item, type, external, scope.layer_titles);
                                    }

                                };
                            }
                        };
                    }])
            }
        }
    })