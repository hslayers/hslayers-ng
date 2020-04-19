export default [
  '$compile',
  'config',
  '$rootScope',
  'hs.layermanager.service',
  'hs.map.service',
  'hs.utils.service',
  '$timeout',
  'hs.layerEditor.sublayerService',
  'hs.layout.service',
  function (
    $compile,
    config,
    $rootScope,
    LayMan,
    hsMap,
    utils,
    $timeout,
    subLayerService,
    layoutService
  ) {
    return {
      template: require('./partials/layerlist.html'),
      controller: [
        '$scope',
        function ($scope) {
          $scope.toggleSublayersVisibility = function (layer) {
            if (LayMan.currentLayer === null) {
              Object.keys(subLayerService.checkedSubLayers).forEach((key) => {
                subLayerService.checkedSubLayers[key] = layer.visible;
              });
              Object.keys(subLayerService.withChildren).forEach((key) => {
                subLayerService.withChildren[key] = layer.visible;
              });
            } else if (LayMan.currentLayer == layer) {
              if (layer.visible == true) {
                if (subLayerService.hasSubLayers()) {
                  Object.keys(subLayerService.checkedSubLayers).forEach(
                    (key) => {
                      subLayerService.checkedSubLayers[key] =
                        subLayerService.checkedSubLayersTmp[key];
                    }
                  );
                  if (Object.keys(subLayerService.withChildren).length === 0) {
                    return;
                  } else {
                    Object.keys(subLayerService.withChildren).forEach((key) => {
                      subLayerService.withChildren[key] =
                        subLayerService.withChildrenTmp[key];
                    });
                  }
                }
              } else {
                if (subLayerService.hasSubLayers()) {
                  Object.keys(subLayerService.checkedSubLayers).forEach(
                    (key) => {
                      subLayerService.checkedSubLayersTmp[key] =
                        subLayerService.checkedSubLayers[key];
                      subLayerService.checkedSubLayers[key] =
                        LayMan.currentLayer.visible;
                    }
                  );
                  if (Object.keys(subLayerService.withChildren).length === 0) {
                    return;
                  } else {
                    Object.keys(subLayerService.withChildren).forEach((key) => {
                      subLayerService.withChildrenTmp[key] =
                        subLayerService.withChildren[key];
                      subLayerService.withChildren[key] =
                        LayMan.currentLayer.visible;
                    });
                  }
                }
              }
            }
          };
        },
      ],
      compile: function compile(element) {
        const contents = element.contents().remove();
        let contentsLinker;

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
            const tmp = [];

            angular.forEach(scope.data.layers, (layer) => {
              if (
                layer.layer.get('path') == scope.obj.hsl_path ||
                ((angular.isUndefined(layer.layer.get('path')) ||
                  layer.layer.get('path') == '') &&
                  scope.obj.hsl_path == '')
              ) {
                tmp.push(layer);
              }
            });
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
            for (let i = 0; i < scope.filtered_layers.length; i++) {
              scope.layer_titles.push(scope.filtered_layers[i].title);
            }
          };

          scope.$on('layermanager.updated', sortLayersByPosition);

          scope.order = function () {
            return config.layer_order || '-position';
          };

          /**
           * @ngdoc method
           * @name hs.layermanager.layerlistDirective#sortLayersByPosition
           * @private
           * @description Sort layers by computed position
           */
          function sortLayersByPosition() {
            scope.filtered_layers = filterLayers();
            const minus = scope.order().indexOf('-') == 0;
            const attribute = scope.order().replaceAll('-', '');
            scope.filtered_layers.sort((a, b) => {
              var a = a.layer.get(attribute);
              var b = b.layer.get(attribute);
              const tmp = (a < b ? -1 : a > b ? 1 : 0) * (minus ? -1 : 1);
              return tmp;
            });
            scope.generateLayerTitlesArray();
          }

          sortLayersByPosition();

          if (angular.isUndefined(contentsLinker)) {
            contentsLinker = $compile(contents);
          }

          contentsLinker(scope, (clonedElement) => {
            iElement.append(clonedElement);
          });

          /**
           * @ngdoc method
           * @name hs.layermanager.layerlistDirective#dragged
           * @public
           * @description Callback for dragged event so event can be injected with correct layer titles list needed for correct recalculation.
           */
          scope.dragged = function (event, index, item, type, external) {
            scope.draggedCont(
              event,
              index,
              item,
              type,
              external,
              scope.layer_titles
            );
          };

          /**
           * @function dragged
           * @memberOf hs.layermanager-layerlist-directive
           * @param {unknow} event
           * @param {unknown} index
           * @param {unknown} item
           * @param {unknown} type
           * @param {unknown} external
           * @param {Array} layerTitles Array of layer titles of group in which layer should be moved in other position
           * @description Callback for dnd-drop event to change layer position in layer manager structure (drag and drop action with layers in layer manager - see https://github.com/marceljuenemann/angular-drag-and-drop-lists for more info about dnd-drop).
           * This is called from layerlistDirective
           */
          scope.draggedCont = function (
            event,
            index,
            item,
            type,
            external,
            layerTitles
          ) {
            if (layerTitles.indexOf(item) < index) {
              index--;
            } //Must take into acount that this item will be removed and list will shift
            const to_title = layerTitles[index];
            let to_index = null;
            let item_index = null;
            const layers = hsMap.map.getLayers();
            //Get the position where to drop the item in the map.getLayers list and which item to remove. because we could be working only within a folder so layer_titles is small
            for (let i = 0; i < layers.getLength(); i++) {
              if (layers.item(i).get('title') == to_title) {
                to_index = i;
              }
              if (layers.item(i).get('title') == item) {
                item_index = i;
              }
              if (index > layerTitles.length) {
                to_index = i + 1;
              } //If dragged after the last item
            }
            const layerPanel = layoutService.contentWrapper.querySelector(
              '.hs-layerpanel'
            );
            let layerNode = document
              .querySelector('.hs-lm-list')
              .querySelectorAll('.hs-lm-item');
            layerNode = layerNode[layerNode.length - 1];
            utils.insertAfter(layerPanel, layerNode);
            const item_layer = layers.item(item_index);
            hsMap.map.getLayers().removeAt(item_index);
            hsMap.map.getLayers().insertAt(to_index, item_layer);
            LayMan.updateLayerOrder();
            const layerDesc = LayMan.getLayerDescriptorForOlLayer(item_layer);
            $timeout((_) => {
              layerNode = document.getElementById(layerDesc.idString());
              utils.insertAfter(layerPanel, layerNode);
              $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
            }, 300);
          };
        };
      },
    };
  },
];
