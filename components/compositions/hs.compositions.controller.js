/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Composition module
 */

define(['angular', 'ol', 'hs.source.SparqlJson', 'angular-socialshare', 'map', 'ows_nonwms', 'config_parsers'],

    function (angular, ol, SparqlJson, social) {
        return {
            init() {
                angular.module('hs.compositions')
                    /**
                     * @module hs.compositions
                     * @name hs.compositions.controller
                     * @ngdoc controller
                     * @description Main controller of composition module
                     */
                    .controller('hs.compositions.controller', ['$scope', 'Core', 'hs.compositions.service', 'hs.compositions.service_parser', '$window', 'config', '$compile',
                        function ($scope, Core, Composition, compositionParser, $window, config, $compile) {
                            $scope.CS = Composition;
                            $scope.data = Composition.data;
                            /**
                            * @ngdoc property
                            * @name hs.compositions.controller#page_size
                            * @public
                            * @type {number} 15
                            * @description Number of compositions displayed on one panel page
                            */
                            $scope.pageSize = 15;
                            $scope.compStart = 0;
                            $scope.compNext = $scope.pageSize;
                            /**
                            * @ngdoc property
                            * @name hs.compositions.controller#panel_name
                            * @deprecated
                            * @type {string} composition_browser
                            * @description 
                            */
                            $scope.panel_name = 'composition_browser';
                            /**
                            * @ngdoc property
                            * @name hs.compositions.controller#keywords
                            * @public
                            * @type {Object} 
                            * @description List of keywords (currently hard-coded selection), with their selection status (Boolean value) which sets if keyword will be applied in compositions lookup
                            */
                            $scope.keywords = {
                                "Basemap": false,
                                "Borders": false,
                                "PhysicalGeography": false,
                                "Demographics": false,
                                "Economics": false,
                                "SocioPoliticalConditions": false,
                                "Culture": false,
                                "Transport": false,
                                "LandUse": false,
                                "Environment": false,
                                "Water": false,
                                "Hazards": false,
                                "Cadastre": false,
                                "Infrastructure": false,
                                "RealEstate": false,
                                "Planning": false,
                                "ComplexInformation": false
                            };
                            /**
                            * @ngdoc property
                            * @name hs.compositions.controller#sortBy
                            * @public
                            * @type {string} bbox
                            * @description Store current rule for sorting compositions in composition list (supported values: bbox, title, date)
                            */
                            $scope.sortBy = 'bbox';
                            /**
                            * @ngdoc property
                            * @name hs.compositions.controller#filterByExtent
                            * @public
                            * @type {Boolean} true
                            * @description Store whether filter compositions by current window extent during composition search
                            */
                            $scope.filterByExtent = true;
                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#getPreviousCompositions
                             * @public
                             * @description Load previous list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
                             */
                            $scope.getPreviousCompositions = function () {
                                if ($scope.compStart - $scope.pageSize < 0) {
                                    $scope.compStart = 0;
                                    $scope.compNext = $scope.pageSize;
                                } else {
                                    $scope.compStart -= $scope.pageSize;
                                    $scope.compNext = $scope.compStart + $scope.pageSize;
                                }
                                $scope.loadCompositions();
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#getNextCompositions
                             * @public
                             * @description Load next list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
                             */
                            $scope.getNextCompositions = function () {
                                if ($scope.compNext != 0) {
                                    $scope.compStart = Math.floor($scope.compNext / $scope.pageSize) * $scope.pageSize;

                                    if ($scope.compNext + $scope.pageSize > $scope.compositionsCount) {
                                        $scope.compNext = $scope.compositionsCount;
                                    } else {
                                        $scope.compNext += $scope.pageSize;
                                    }
                                    $scope.loadCompositions();
                                }
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#loadCompositions
                             * @public
                             * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
                             */
                            $scope.loadCompositions = function () {
                                Composition.loadCompositions({
                                    query: $scope.query,
                                    sortBy: $scope.sortBy,
                                    filterExtent: $scope.filterByExtent,
                                    keywords: $scope.keywords,
                                    start: $scope.compStart,
                                    limit: $scope.pageSize
                                });
                            }

                            $scope.$watch('data.next', function () {
                                $scope.compNext = $scope.data.next;
                            })

                            /**
                             * Handler of "Only mine" filter change, delete editable variable if needed
                             * @module hs.compositions.controller
                             * @function miniFilterChanged
                             * DEPRECATED?
                             */
                            $scope.mineFilterChanged = function () {
                                if (angular.isDefined($scope.query.editable) && $scope.query.editable == false) delete $scope.query.editable;
                            }

                            $scope.getPageSize = function () {
                                let listHeight = screen.height;
                                try {
                                    var $mdMedia = $injector.get('$mdMedia');
                                    if ($mdMedia("gt-sm")) {
                                        let panel = document.getElementById('sidenav-right');
                                        if (panel) listHeight = panel.clientHeight;
                                    }
                                } catch(ex){}
                                $scope.pageSize = Math.round((listHeight - 180) / 60);
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#filterChanged
                             * @public
                             * @description Reloads compositions from start, used as callback when filters are changed in view
                             */
                            $scope.filterChanged = function () {
                                Composition.resetCompositionCounter();
                                $scope.compStart = 0;
                                $scope.compNext = $scope.pageSize;
                                $scope.loadCompositions();
                            }

                            /**
                            * @ngdoc method
                            * @name hs.compositions.controller#confirmDelete
                            * @public
                            * @param {object} composition Composition selected for deletion    
                            * @param {object} ev
                            * @description Display delete dialog of composition 
                            */
                            $scope.confirmDelete = function (composition, ev) {
                                $scope.compositionToDelete = composition;
                                if (config.design === 'md')
                                    $scope.deleteDialogMd();
                                else
                                    deleteDialogBootstrap()
                            }

                            function deleteDialogBootstrap(ev) {
                                if (!$scope.$$phase) $scope.$digest();
                                var previousDialog = document.getElementById("composition-delete-dialog");
                                if (previousDialog)
                                    previousDialog.parentNode.removeChild(previousDialog);
                                var el = angular.element('<div hs.compositions.delete_dialog_directive></span>');
                                document.getElementById("hs-dialog-area").appendChild(el[0]);
                                $compile(el)($scope);
                            }

                            try {
                                var $mdDialog = $injector.get('$mdDialog');
                
                                $scope.deleteDialogMd = function(ev) {
                                    $mdDialog.show({
                                        parent: angular.element('#hsContainer'),
                                        targetEvent: ev,
                                        clickOutsideToClose: true,
                                        escapeToClose: true,
                                        scope: $scope,
                                        preserveScope: true,
                                        template: require('materialComponents/panelContents/compositionLoadUnsavedDialog.html'),
                                        controller: function DialogController($scope, $mdDialog) {
                                            $scope.closeDialog = function () {
                                                $mdDialog.hide();
                                            }
                                        }
                                    });
                                }

                                $scope.shareDialogMd = function($event) {
                                    $mdDialog.show({
                                        parent: angular.element('#hsContainer'),
                                        targetEvent: $event,
                                        clickOutsideToClose: true,
                                        escapeToClose: true,
                                        scope: $scope,
                                        preserveScope: true,
                                        template: require('components/compositions/partials/dialog_sharemd.html'),
                                        controller: function DialogController($scope, $mdDialog) {
                                            $scope.closeDialog = function () {
                                                $mdDialog.hide();
                                            }
                                        }
                                    });
                                }

                                $scope.infoDialogMD = function($event) {
                                    var parentEl = angular.element('#hsContainer');
                                    $mdDialog.show({
                                        parent: parentEl,
                                        targetEvent: $event,
                                        clickOutsideToClose: true,
                                        escapeToClose: true,
                                        template:
                                            '<md-dialog aria-label="List dialog">' +
                                            '  <md-dialog-content layout="column" layout-padding>' +
                                            '    <md-list>' +
                                            '    <div layout="row">' +
                                            '       <span flex="30">Abstract</span><span flex="70">{{info.abstract}}</span>' +
                                            '    </div>' +
                                            '    <div layout="row">' +
                                            '       <span flex="30">Thumbnail</span><span flex="70">{{info.thumbnail}}</span>' +
                                            '    </div>' +
                                            '    <div layout="row">' +
                                            '       <span flex="30">Extent</span><span flex="70">{{info.extent}}</span>' +
                                            '    </div>' +
                                            '    <div layout="row" ng-repeat="layer in info.layers">' +
                                            '       <span flex="30">Layer</span><span flex="70">{{layer.title}}</span>' +
                                            '    </div>' +
                                            '    </md-list>' +
                                            '  </md-dialog-content>' +
                                            '  <md-dialog-actions>' +
                                            '    <md-button ng-click="closeDialog()" class="md-primary">' +
                                            '      Close' +
                                            '    </md-button>' +
                                            '  </md-dialog-actions>' +
                                            '</md-dialog>',
                                        locals: {
                                            info: $scope.info
                                        },
                                        controller: DialogController
                                    });
    
                                    function DialogController($scope, $mdDialog, info) {
                                        $scope.info = info;
                                        $scope.closeDialog = function () {
                                            $mdDialog.hide();
                                        }
                                    }
                                }

                                $scope.loadUnsavedDialogMD = function() {
                                    $mdDialog.show({
                                        parent: angular.element('#hsContainer'),
                                        clickOutsideToClose: true,
                                        escapeToClose: true,
                                        scope: $scope,
                                        preserveScope: true,
                                        template: require('materialComponents/panelContents/compositionLoadUnsavedDialog.html'),
                                        controller: function DialogController($scope, $mdDialog) {
                                            $scope.closeDialog = function () {
                                                $mdDialog.hide();
                                            }
                                        }
                                    });
                                }
                            } catch(ex){}

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#delete
                             * @public
                             * @param {object} composition Composition selected for deletion    
                             * @description Delete selected composition from project (including deletion from composition server, useful for user created compositions) 
                             */
                            $scope.delete = function (composition) {
                                Composition.deleteComposition(composition);
                            }

                            /**
                             * Load selected composition for editing
                             * @module hs.compositions.controller
                             * @function edit
                             * @param {object} composition Selected composition
                             */
                            $scope.edit = function (composition) {
                                $scope.data.useCallbackForEdit = true;
                                Composition.loadComposition(composition);
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#highlightComposition
                             * @public
                             * @param {Object} composition Composition to highlight
                             * @param {Boolean} state Target state of composition ( True - highlighted, False - normal) 
                             * @description Highlight (or dim) composition, toogle visual state of composition extent on map
                             */
                            $scope.highlightComposition = function (composition, state) {
                                Composition.highlightComposition(composition, state);
                            }

                            $scope.$on('map.extent_changed', function (event, data, b) {
                                if (Core.mainpanel != 'composition_browser' && Core.mainpanel != 'composition') return;
                                if ($scope.filterByExtent) $scope.loadCompositions();
                            });

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#shareComposition
                             * @public
                             * @param {object} record Composition to share
                             * @description Prepare share object on server and display share dialog to share composition
                             */
                            $scope.shareComposition = function (record, $event) {
                                Composition.shareComposition(record);
                                if (config.design === 'md')
                                    $scope.shareDialogMd($event);
                                else
                                    shareDialogBootstrap()
                            }

                            function shareDialogBootstrap($event) {
                                var previousDialog = document.getElementById("composition-share-dialog")
                                if (previousDialog)
                                    previousDialog.parentNode.removeChild(previousDialog);
                                var el = angular.element('<div hs.compositions.share_dialog_directive></div>');
                                $compile(el)($scope);
                                document.getElementById("hs-dialog-area").appendChild(el[0]);
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#detailComposition
                             * @public
                             * @param {object} record Composition to show details
                             * @description Load info about composition through service and display composition info dialog
                             */
                            $scope.detailComposition = function (record, $event) {
                                Composition.getCompositionInfo(record, function (info) {
                                    $scope.info = info;
                                    if (config.design === 'md')
                                        $scope.infoDialogMD($event);
                                    else
                                        infoDialogBootstrap();
                                });
                            }

                            function infoDialogBootstrap() {
                                if (!$scope.$$phase) $scope.$digest();
                                var previousDialog = document.getElementById("composition-info-dialog");
                                if (previousDialog)
                                    previousDialog.parentNode.removeChild(previousDialog);
                                var el = angular.element('<div hs.compositions.info_dialog_directive></span>');
                                document.getElementById("hs-dialog-area").appendChild(el[0]);
                                $compile(el)($scope);
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#loadComposition
                             * @public 
                             * @param {object} record Composition to be loaded 
                             * @description Load selected composition in map, if current composition was edited display Ovewrite dialog
                             */
                            $scope.loadComposition = function (record) {
                                Composition.loadCompositionParser(record);
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#overwrite
                             * @public
                             * @description Load new composition without saving old composition
                             */
                            $scope.overwrite = function () {
                                Composition.loadComposition($scope.compositionToLoad, true);
                                $scope.overwriteModalVisible = false
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#add
                             * @public
                             * @description Load new composition (with service_parser Load function) and merge it with old composition
                             */
                            $scope.add = function () {
                                Composition.loadComposition($scope.compositionToLoad, false);
                                $scope.overwriteModalVisible = false;
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#save
                             * @public
                             * @description Open Status creator panel for saving old composition
                             */
                            $scope.save = function () {
                                Core.openStatusCreator();
                                $scope.overwriteModalVisible = false;
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#setSortAttribute
                             * @public
                             * @param {String} attribute Attribute by which compositions should be sorted (expected values: bbox, title, date)
                             * @description Set sort attribute for sorting composition list and reload compositions 
                             */
                            $scope.setSortAttribute = function (attribute) {
                                $scope.sortBy = attribute;
                                $scope.loadCompositions();
                            }

                            /**
                             * @ngdoc method
                             * @name hs.compositions.controller#toggleKeywords
                             * @public
                             * @description Toogle keywords panel on compositions panel
                             */
                            $scope.toggleKeywords = function () {
                                $(".keywords-panel").slideToggle();
                            }

                            $scope.handleFileSelect = function (evt) {
                                var files = evt.target.files; // FileList object
                                for (var i = 0, f; f = files[i]; i++) {
                                    if (!f.type.match('application/json')) {
                                        continue;
                                    }
                                    var reader = new FileReader();
                                    reader.onload = function (theFile) {
                                        var json = JSON.parse(reader.result);
                                        compositionParser.loadCompositionObject(json, true);
                                    };
                                    reader.readAsText(f);
                                }
                            }

                            $scope.$on('CompositionLoaded', function () {
                                $('.tooltip').remove();
                                $('[data-toggle="tooltip"]').tooltip();
                            });

                            $scope.$on('compositions.composition_deleted', function () {
                                var deleteDialog = document.getElementById("composition-delete-dialog");
                                deleteDialog.parentNode.remove(deleteDialog);
                            });

                            $scope.$on('loadComposition.notSaved', function (event, data) {
                                $scope.compositionToLoad = data.link;
                                if (config.design === 'md')
                                    $scope.loadUnsavedDialogMD();
                                else
                                    loadUnsavedDialogBootstrap();
                            });

                            function loadUnsavedDialogBootstrap() {
                                var dialog_id = 'composition-overwrite-dialog';
                                $scope.composition_name_to_be_loaded = data.title;
                                if (document.getElementById(dialog_id) == null) {
                                    var el = angular.element('<div hs.compositions.overwrite_dialog_directive></span>');
                                    document.getElementById("hs-dialog-area").appendChild(el[0]);;
                                    $compile(el)($scope);
                                } else {
                                    $scope.overwriteModalVisible = true;
                                }
                            }

                            $scope.$on('core.mainpanel_changed', function (event) {
                                if (Core.mainpanel === 'composition_browser' || Core.mainpanel === 'composition') {
                                    $scope.loadCompositions();
                                }
                            });

                            $scope.getPageSize();
                            $window.addEventListener('resize', function () {
                                $scope.getPageSize();
                            });
                            $scope.$on("Core_sizeChanged", function () {
                                $scope.getPageSize();
                            });

                            $scope.$emit('scope_loaded', "Compositions");
                        }
                    ])
            }
        }

    })
