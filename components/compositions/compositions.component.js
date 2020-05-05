import compositionsService from './compositions.service';

export default {
  template: [
    'config',
    (config) => {
      if (config.design == 'md') {
        return require('./partials/compositionsmd.html');
      } else {
        return require('./partials/compositions.html');
      }
    },
  ],
  controller: [
    '$scope',
    'Core',
    'hs.map.service',
    'hs.compositions.service',
    'hs.compositions.service_parser',
    '$window',
    'config',
    '$compile',
    'hs.compositions.mickaService',
    '$rootScope',
    'hs.layout.service',
    'hs.common.endpointsService',
    'hs.utils.service',
    'hs.compositions.mapService',
    'forCompositionsFilter',
    function (
      $scope,
      Core,
      hsMap,
      Composition,
      compositionParser,
      $window,
      config,
      $compile,
      mickaEndpointService,
      $rootScope,
      layoutService,
      endpointsService,
      utils,
      mapService,
      forCompositionsFilter
    ) {
      $scope.CS = Composition;
      $scope.data = Composition.data;
      $scope.config = config;
      $scope.mickaEndpointService = mickaEndpointService;
      $scope.endpointsService = endpointsService;
      endpointsService.endpoints.forEach((ep) => (ep.next = ep.limit));
      /**
       * @ngdoc property
       * @name hs.compositions.controller#keywords
       * @public
       * @type {Object}
       * @description List of keywords (currently hard-coded selection), with their selection status (Boolean value) which sets if keyword will be applied in compositions lookup
       */
      $scope.keywords = {
        'Basemap': false,
        'Borders': false,
        'PhysicalGeography': false,
        'Demographics': false,
        'Economics': false,
        'SocioPoliticalConditions': false,
        'Culture': false,
        'Transport': false,
        'LandUse': false,
        'Environment': false,
        'Water': false,
        'Hazards': false,
        'Cadastre': false,
        'Infrastructure': false,
        'RealEstate': false,
        'Planning': false,
        'ComplexInformation': false,
      };
      $scope.addCompositionUrlVisible = false;
      $scope.changeUrlButtonVisible = function () {
        $scope.addCompositionUrlVisible = !$scope.addCompositionUrlVisible;
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
      $scope.getPreviousCompositions = function (ds) {
        if (ds.start - ds.limit < 0) {
          ds.start = 0;
          ds.next = ds.limit;
        } else {
          ds.start -= ds.limit;
          ds.next = ds.start + ds.limit;
        }
        $scope.loadCompositions(ds);
      };

      /**
       * @ngdoc method
       * @name hs.compositions.controller#getNextCompositions
       * @public
       * @description Load next list of compositions to display on pager (number per page set by {@link hs.compositions.controller#page_size hs.compositions.controller#page_size})
       */
      $scope.getNextCompositions = function (ds) {
        if (ds.next != 0) {
          ds.start = Math.floor(ds.next / ds.limit) * ds.limit;

          if (ds.next + ds.limit > ds.compositionsCount) {
            ds.next = ds.compositionsCount;
          } else {
            ds.next += ds.limit;
          }
          $scope.loadCompositions(ds);
        }
      };

      /**
       * @ngdoc method
       * @name hs.compositions.controller#loadCompositions
       * @public
       * @description Load list of compositions according to current filter values and pager position (filter, keywords, current extent, start composition, compositions number per page). Display compositions extent in map
       */
      $scope.loadCompositions = function (ds) {
        return new Promise((resolve, reject) => {
          hsMap.loaded().then((map) => {
            Composition.loadCompositions(ds, {
              query: $scope.query,
              sortBy: $scope.sortBy,
              filterExtent: $scope.filterByExtent,
              keywords: $scope.keywords,
              start: ds.start,
              limit: ds.limit,
            }).then((_) => {
              resolve();
            });
          });
        });
      };

      /**
       * Handler of "Only mine" filter change, delete editable variable if needed
       * @module hs.compositions.controller
       * @function miniFilterChanged
       * DEPRECATED?
       */
      $scope.mineFilterChanged = function () {
        if (
          angular.isDefined($scope.query.editable) &&
          $scope.query.editable == false
        ) {
          delete $scope.query.editable;
        }
      };

      $scope.getPageSize = function () {
        let listHeight = screen.height;
        try {
          const $mdMedia = $injector.get('$mdMedia');
          if ($mdMedia('gt-sm')) {
            const panel = document.getElementById('sidenav-right');
            if (panel) {
              listHeight = panel.clientHeight;
            }
          }
        } catch (ex) {}
        endpointsService.endpoints.forEach((ds) => {
          ds.limit = Math.round((listHeight - 180) / 60);
        });
      };

      /**
       * @ngdoc method
       * @name hs.compositions.controller#filterChanged
       * @public
       * @description Reloads compositions from start, used as callback when filters are changed in view
       */
      $scope.filterChanged = function () {
        Composition.resetCompositionCounter();
        forCompositionsFilter(endpointsService.endpoints).forEach((ds) => {
          ds.start = 0;
          ds.next = ds.limit;
          $scope.loadCompositions(ds);
        });
      };

      /**
       * @ngdoc method
       * @name hs.compositions.controller#confirmDelete
       * @public
       * @param {object} composition Composition selected for deletion
       * @description Display delete dialog of composition
       */
      $scope.confirmDelete = function (composition) {
        $scope.compositionToDelete = composition;
        if (config.design === 'md') {
          $scope.deleteDialogMd();
        } else {
          deleteDialogBootstrap();
        }
      };

      function deleteDialogBootstrap(ev) {
        const previousDialog = layoutService.contentWrapper.querySelector(
          '.hs-composition-delete-dialog'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs.compositions.delete_dialog_directive></div>'
        );
        layoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)($scope);
      }

      try {
        const $mdDialog = $injector.get('$mdDialog');

        $scope.deleteDialogMd = function (ev) {
          $mdDialog.show({
            parent: angular.element('#hsContainer'),
            targetEvent: ev,
            clickOutsideToClose: true,
            escapeToClose: true,
            scope: $scope,
            preserveScope: true,
            template: require('./partials/compositionLoadUnsavedDialog.html'),
            controller: function DialogController($scope, $mdDialog) {
              $scope.closeDialog = function () {
                $mdDialog.hide();
              };
            },
          });
        };

        $scope.shareDialogMd = function ($event) {
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
              };
            },
          });
        };

        $scope.infoDialogMD = function ($event) {
          const parentEl = angular.element('#hsContainer');
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
              info: $scope.info,
            },
            controller: DialogController,
          });

          function DialogController($scope, $mdDialog, info) {
            $scope.info = info;
            $scope.closeDialog = function () {
              $mdDialog.hide();
            };
          }
        };

        $scope.loadUnsavedDialogMD = function () {
          $mdDialog.show({
            parent: angular.element('#hsContainer'),
            clickOutsideToClose: true,
            escapeToClose: true,
            scope: $scope,
            preserveScope: true,
            template: require('./partials/compositionLoadUnsavedDialog.html'),
            controller: function DialogController($scope, $mdDialog) {
              $scope.closeDialog = function () {
                $mdDialog.hide();
              };
            },
          });
        };
      } catch (ex) {}

      /**
       * @ngdoc method
       * @name hs.compositions.controller#delete
       * @public
       * @param {object} composition Composition selected for deletion
       * @description Delete selected composition from project (including deletion from composition server, useful for user created compositions)
       */
      $scope.delete = function (composition) {
        Composition.deleteComposition(composition);
      };

      /**
       * Load selected composition for editing
       * @module hs.compositions.controller
       * @function edit
       * @param {object} composition Selected composition
       */
      $scope.edit = function (composition) {
        Composition.loadCompositionParser(composition)
          .then(() => {
            $rootScope.$broadcast('StatusCreator.open', composition);
          })
          .catch(() => {});
      };

      /**
       * @ngdoc method
       * @name hs.compositions.controller#highlightComposition
       * @public
       * @param {Object} composition Composition to highlight
       * @param {Boolean} state Target state of composition ( True - highlighted, False - normal)
       * @description Highlight (or dim) composition, toogle visual state of composition extent on map
       */
      $scope.highlightComposition = function (composition, state) {
        mapService.highlightComposition(composition, state);
      };

      const extendChangeDebouncer = {};
      $scope.$on(
        'map.extent_changed',
        utils.debounce(
          (event, data, b) => {
            if (
              layoutService.mainpanel != 'composition_browser' &&
              layoutService.mainpanel != 'composition'
            ) {
              return;
            }
            if ($scope.filterByExtent) {
              loadCompositionsForAllEndpoints();
            }
          },
          400,
          false,
          extendChangeDebouncer
        )
      );

      function loadCompositionsForAllEndpoints() {
        forCompositionsFilter(endpointsService.endpoints)
          .forEach((ds) => {
            $scope.loadCompositions(ds);
          });
      }

      /**
       * @ngdoc method
       * @name hs.compositions.controller#shareComposition
       * @public
       * @param {object} record Composition to share
       * @description Prepare share object on server and display share dialog to share composition
       */
      $scope.shareComposition = function (record, $event) {
        Composition.shareComposition(record);
        if (config.design === 'md') {
          $scope.shareDialogMd($event);
        } else {
          shareDialogBootstrap();
        }
      };

      function shareDialogBootstrap($event) {
        const previousDialog = layoutService.contentWrapper.querySelector(
          '.composition-share-dialog'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs.compositions.share_dialog_directive></div>'
        );
        $compile(el)($scope);
        layoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
      }

      /**
       * @ngdoc method
       * @name hs.compositions.controller#detailComposition
       * @public
       * @param {object} record Composition to show details
       * @description Load info about composition through service and display composition info dialog
       */
      $scope.detailComposition = function (record, $event) {
        Composition.getCompositionInfo(record, (info) => {
          $scope.info = info;
          if (config.design === 'md') {
            $scope.infoDialogMD($event);
          } else {
            infoDialogBootstrap();
          }
        });
      };

      function infoDialogBootstrap() {
        const previousDialog = layoutService.contentWrapper.querySelector(
          '.hs-composition-info-dialog'
        );
        if (previousDialog) {
          previousDialog.parentNode.removeChild(previousDialog);
        }
        const el = angular.element(
          '<div hs.compositions.info_dialog_directive></div>'
        );
        layoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)($scope);
      }

      /**
       * @ngdoc method
       * @name hs.compositions.controller#loadComposition
       * @public
       * @param {object} record Composition to be loaded
       * @description Load selected composition in map, if current composition was edited display Ovewrite dialog
       */
      $scope.startLoadComposition = function (record) {
        Composition.loadCompositionParser(record)
          .then((_) => {})
          .catch((_) => {});
      };

      /**
       * @ngdoc method
       * @name hs.compositions.controller#overwrite
       * @public
       * @description Load new composition without saving old composition
       */
      $scope.overwrite = function () {
        Composition.loadComposition(Composition.compositionToLoad.url, true);
        $scope.overwriteModalVisible = false;
      };

      /**
       * @ngdoc method
       * @name hs.compositions.controller#add
       * @public
       * @description Load new composition (with service_parser Load function) and merge it with old composition
       */
      $scope.add = function () {
        Composition.loadComposition(Composition.compositionToLoad.url, false);
        $scope.overwriteModalVisible = false;
      };

      $scope.addCompositionUrl = function (url) {
        if (compositionParser.composition_edited == true) {
          $rootScope.$broadcast('loadComposition.notSaved', url);
        } else {
          compositionsService.loadComposition(url, true).then((_) => {
            $scope.addCompositionUrlVisible = false;
          });
        }
      };

      /**
       * @ngdoc method
       * @name hs.compositions.controller#setSortAttribute
       * @public
       * @param {String} attribute Attribute by which compositions should be sorted (expected values: bbox, title, date)
       * @description Set sort attribute for sorting composition list and reload compositions
       */
      $scope.setSortAttribute = function (attribute) {
        $scope.sortBy = attribute;
        loadCompositionsForAllEndpoints();
      };

      $scope.handleFileSelect = function (evt) {
        const files = evt.target.files; // FileList object
        for (var i = 0, f; (f = files[i]); i++) {
          if (!f.type.match('application/json')) {
            continue;
          }
          var reader = new FileReader();
          reader.onload = function (theFile) {
            const json = JSON.parse(reader.result);
            compositionParser.loadCompositionObject(json, true);
          };
          reader.readAsText(f);
        }
      };

      $scope.datasetSelect = Composition.datasetSelect;

      $scope.$on('compositions.composition_deleted', (event, composition) => {
        const deleteDialog = layoutService.contentWrapper.querySelector(
          '.hs-composition-delete-dialog'
        );
        if (deleteDialog) {
          deleteDialog.parentNode.remove(deleteDialog);
        }
        $scope.loadCompositions(composition.endpoint);
      });

      $scope.$on('loadComposition.notSaved', (event, url, title) => {
        Composition.compositionToLoad = {url, title};
        if (config.design === 'md') {
          $scope.loadUnsavedDialogMD();
        } else {
          loadUnsavedDialogBootstrap(url, title);
        }
      });

      function loadUnsavedDialogBootstrap(url, title) {
        const dialog_id = 'hs-composition-overwrite-dialog';
        $scope.composition_name_to_be_loaded = title;
        if (
          layoutService.contentWrapper.querySelector('.' + dialog_id) == null
        ) {
          const el = angular.element(
            '<div hs.compositions.overwrite_dialog_directive></span>'
          );
          layoutService.contentWrapper
            .querySelector('.hs-dialog-area')
            .appendChild(el[0]);
          $compile(el)($scope);
        } else {
          $scope.overwriteModalVisible = true;
        }
      }

      $scope.commonId = function (composition) {
        return composition.uuid || composition.id;
      };

      $scope.compositionClicked = function (composition) {
        $scope.selectedCompId = $scope.commonId(composition);
        $scope.startLoadComposition(composition);
      };

      $scope.$on('core.mainpanel_changed', (event) => {
        if (
          layoutService.mainpanel === 'composition_browser' ||
          layoutService.mainpanel === 'composition'
        ) {
          loadCompositionsForAllEndpoints();
        }
      });

      $scope.getPageSize();
      $window.addEventListener('resize', () => {
        $scope.getPageSize();
      });
      $scope.$on('Core_sizeChanged', () => {
        $scope.getPageSize();
      });

      //This was put here from link function of previous compositions.directive
      //since components dont support link functions anymore
      if (angular.isUndefined(config.design) || config.design == '') {
        var el = document.getElementsByClassName('mid-pane');
        if (el.length > 0) {
          el[0].style.marginTop = '0px';
        }
        var el = document.getElementsByClassName('keywords-panel');
        if (el.length > 0) {
          el[0].style.display = 'none';
        }
      }

      $scope.$emit('scope_loaded', 'Compositions');
    },
  ],
};
