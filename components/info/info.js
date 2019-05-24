/**
 * @ngdoc module
 * @module hs.info
 * @name hs.info
 * @description Module responsible for info application status information window. Contain HS-Layers default info template and its controller. When included, it also updates webpage meta tags with current map information.
 */
define(['angular', 'map', 'core', 'update-meta', 'permalink'],

    function(angular) {
        angular.module('hs.info', ['hs.map', 'hs.core', 'updateMeta'])
            /**
             * @module hs.info
             * @name hs.info.directive
             * @ngdoc directive
             * @description Template of info window. Shows mainly current composition status. Also display loading sign when composition is loading. 
             */
            .directive('hs.info.directive', ['config', function (config) {
                return {
                    template: require('components/info/partials/info.html')
                };
            }])

        /**
         * @module info
         * @name hs.info.controller
         * @ngdoc controller
         * @description Default controller of info module. Automatically updates composition abstract and status when composition is changed through appropriete composition / layermanager events.
         */
        .controller('hs.info.controller', ['$rootScope', '$scope', '$timeout', 'Core',
            function($rootScope, $scope, $timeout, Core) {
                $scope.Core = Core;
                /**
                * @ngdoc property
                * @name hs.info.controller#composition_loaded
                * @public
                * @type {Boolean} true
                * @description Store if composition is loaded
                */
                $scope.composition_loaded = true;
                /**
                * @ngdoc property
                * @name hs.info.controller#layer_loading
                * @public
                * @type {Array} null
                * @description List of layers which are currently loading.
                */
                $scope.layer_loading = [];

                $scope.$on('compositions.composition_loading', function(event, data) {
                    if (angular.isUndefined(data.error)) {
                        if (angular.isDefined(data.data)) {
                            /**
                            * @ngdoc property
                            * @name hs.info.controller#composition_abstract
                            * @public
                            * @type {String} null
                            * @description Abstract of current composition (filled when first composition is loaded)
                            */
                            $scope.composition_abstract = data.data.abstract;
                            /**
                            * @ngdoc property
                            * @name hs.info.controller#composition_title
                            * @public
                            * @type {String} null
                            * @description Title of current composition (filled when first composition is loaded)
                            */
                            $scope.composition_title = data.data.title;
                            /**
                            * @ngdoc property
                            * @name hs.info.controller#composition_id
                            * @public
                            * @type {Number} null
                            * @description Id of current composition (filled when first composition is loaded)
                            */
                            $scope.composition_id = data.data.id;
                        } else {
                            $scope.composition_abstract = data.abstract;
                            $scope.composition_title = data.title;
                            $scope.composition_id = data.id;
                        }
                        $scope.composition_loaded = false;
                        //Composition image (should be glyphicon?)
                        $scope.info_image = 'icon-map';
                    }
                });

                $scope.$on('compositions.composition_loaded', function(event, data) {
                    if (angular.isDefined(data.error)) {
                        var temp_abstract = $scope.composition_abstract;
                        var temp_title = $scope.composition_title;
                        $scope.composition_abstract = data.abstract;
                        $scope.composition_title = data.title;
                        $scope.info_image = 'icon-warning-sign';
                        $timeout(function() {
                            $scope.composition_title = temp_title;
                            $scope.composition_abstract = temp_abstract;
                            $scope.info_image = 'icon-map';
                            if (!$scope.$$phase) $scope.$digest();
                        }, 3000);
                    }
                    $scope.composition_loaded = true;
                    /**
                    * @ngdoc property
                    * @name hs.info.controller#composition_edited
                    * @public
                    * @type {Boolean} null
                    * @description Status of composition edit (true for edited composition) 
                    */
                    $scope.composition_edited = false;
                    if (!$scope.$$phase) $scope.$digest();
                });

                $scope.$on('layermanager.layer_loading', function(event, layer) {
                    if (!(layer.get('title') in $scope.layer_loading)) {
                        $scope.layer_loading.push(layer.get('title'));
                    }
                    $scope.composition_loaded = false;
                    if (!$scope.$$phase) $scope.$digest();
                })

                $scope.$on('layermanager.layer_loaded', function(event, layer) {
                    for (var i = 0; i < $scope.layer_loading.length; i++) {
                        if ($scope.layer_loading[i] == layer.get('title')) {
                            $scope.layer_loading.splice(i, 1);
                        }
                    }

                    if ($scope.layer_loading.length == 0) {
                        $scope.composition_loaded = true;
                    }
                    if (!$scope.$$phase) $scope.$digest();
                })

                $scope.$on('compositions.composition_deleted', function(event, id) {
                    if (id == $scope.composition_id) {
                        delete $scope.composition_title;
                        delete $scope.composition_abstract;
                        if (!$scope.$$phase) $scope.$digest();
                    }
                });

                $scope.$on('core.map_reset', function(event) {
                    $timeout(function(){
                        delete $scope.composition_title;
                        delete $scope.composition_abstract;
                        $scope.layer_loading.length = 0;
                        $scope.composition_loaded = true;
                        $scope.composition_edited = false;
                    })
                });

                /**
                 * @ngdoc method
                 * @name hs.info.controller#compositionLoaded
                 * @public
                 * @description Test if composition is loaded, to change info template.
                 */
                $scope.compositionLoaded = function() {
                    return angular.isDefined($scope.composition_title);
                }

                $rootScope.$on('compositions.composition_edited', function(event) {
                    $scope.composition_edited = true;
                });

                $scope.$emit('scope_loaded', "info");
            }

        ]);
    })
