import VectorLayer from 'ol/layer/Vector';
import WFS from 'ol/format';
import {Circle, Fill, RegularShape, Stroke, Style, Text} from 'ol/style';
import {Cluster, Vector as VectorSource} from 'ol/source';

export default {
  template: require('./partials/layer-editor.html'),
  bindings: {
    currentLayer: '=',
  },
  controller: function (
    $scope,
    HsUtilsService,
    HsLayerUtilsService,
    HsLayermanagerWmstService,
    HsLegendService,
    HsStylerService,
    HsMapService,
    HsLayermanagerService,
    $rootScope,
    HsLayoutService,
    HsLayerEditorSublayerService,
    HsLayerEditorService,
    HsDrawService
  ) {
    'ngInject';
    $scope.distance = {
      value: 40,
    };
    angular.extend($scope, {
      layer_renamer_visible: false,
      legendService: HsLegendService,
      legendDescriptors: [],
      layoutService: HsLayoutService,
      layerIsWmsT() {
        return HsLayermanagerWmstService.layerIsWmsT($scope.$ctrl.currentLayer);
      },
      /**
       * @function isLayerWMS
       * @memberOf hs.layermanager.controller
       * @param {Ol.layer} layer Selected layer
       * @description Test if layer is WMS layer
       * @deprecated TODO
       */
      isLayerWMS: HsLayerUtilsService.isLayerWMS,
      /**
       * @function zoomToLayer
       * @memberOf hs.layermanager.controller
       * @description Zoom to selected layer (layer extent). Get extent
       * from bounding box property, getExtent() function or from
       * BoundingBox property of GetCapabalities request (for WMS layer)
       * @returns {Promise}
       */
      zoomToLayer() {
        return HsLayerEditorService.zoomToLayer($scope.olLayer());
      },

      /**
       * @function styleLayer
       * @memberOf hs.layermanager.controller
       * @param {Ol.layer} layer Selected layer
       * @description Display styler panel for selected layer, so user can change its style
       */
      styleLayer() {
        const layer = $scope.olLayer();
        HsStylerService.layer = layer;
        HsLayoutService.setMainPanel('styler');
      },
      /**
       * @function isLayerVectorLayer
       * @memberOf hs.layermanager.controller
       * @param {Ol.layer} layer Selected layer
       * @description Test if layer is WMS layer
       */
      isLayerVectorLayer: HsLayerUtilsService.isLayerVectorLayer,
      /**
       * @function isVectorLayer
       * @memberOf hs.layermanager.controller
       * @param {Ol.layer} layer Selected layer
       * @description Test if layer is WMS layer
       */
      isVectorLayer() {
        if (!$scope.$ctrl.currentLayer) {
          return;
        }
        const layer = $scope.olLayer();
        if (!$scope.isLayerVectorLayer(layer)) {
          return;
        } else {
          return true;
        }
      },

      /**
       * @function Declutter
       * @memberOf hs.layermanager.controller
       * @param {boolean} newValue To declutter or not to declutter
       * @description Set decluttering of features
       * @returns {boolean} Current declutter state
       */
      declutter(newValue) {
        if (!$scope.$ctrl.currentLayer) {
          return;
        }
        return HsLayerEditorService.declutter($scope.olLayer(), newValue);
      },

      /**
       * @function cluster
       * @memberOf hs.layermanager.controller
       * @description Set cluster for layer
       * @param {boolean} newValue To cluster or not to cluster
       * @returns {boolean} Current cluster state
       */
      cluster(newValue) {
        if (!$scope.$ctrl.currentLayer) {
          return;
        }
        return HsLayerEditorService.cluster(
          $scope.olLayer(),
          newValue,
          $scope.distance.value
        );
      },
      /**
       * @function changeDistance
       * @memberOf hs.layermanager.controller
       * @description Set distance between cluster features;
       */
      changeDistance() {
        if (!$scope.$ctrl.currentLayer) {
          return;
        }
        const layer = $scope.olLayer();
        if (angular.isUndefined(layer.getSource().setDistance)) {
          return;
        }
        layer.getSource().setDistance($scope.distance.value);
      },
      /**
       * @function toggleLayerRename
       * @memberOf hs.layermanager.controller
       * @description Toogle layer rename control on panel (through layer rename variable)
       */
      toggleLayerRename() {
        $scope.layer_renamer_visible = !$scope.layer_renamer_visible;
      },

      showRemoveLayerDiag(e, layer) {
        try {
          const $mdDialog = $injector.get('$mdDialog');

          const confirm = $mdDialog
            .confirm()
            .title('Remove layer ' + layer.title)
            .textContent('Are you sure about layer removal?')
            .ariaLabel('Confirm layer removal')
            .targetEvent(e)
            .ok('Remove')
            .cancel('Cancel')
            .hasBackdrop(false);

          $mdDialog.show(confirm).then(
            () => {
              $scope.removeLayer(layer.layer);
            },
            () => {}
          );
        } catch (ex) {}
      },

      /**
       * @function opacity
       * @memberOf hs.layermanager.controller
       * @description Set selected layers opacity and emits "compositionchanged"
       * @param newValue
       */
      opacity(newValue) {
        if (!$scope.$ctrl.currentLayer) {
          return;
        }
        const layer = $scope.olLayer();
        if (arguments.length) {
          layer.setOpacity(newValue);
          $scope.$emit('compositions.composition_edited');
        } else {
          return layer.getOpacity();
        }
      },

      /**
       * @function layerIsZoomable
       * @memberOf hs.layermanager.controller
       * @description Determines if layer has BoundingBox defined as
       * its metadata or is a Vector layer. Used for setting visibility
       * of 'Zoom to ' button
       * @param {Ol.layer} layer Selected layer
       */
      layerIsZoomable() {
        return HsLayerUtilsService.layerIsZoomable($scope.olLayer());
      },

      /**
       * @function layerIsStyleable
       * @memberOf hs.layermanager.controller
       * @description Determines if layer is a Vector layer and
       * styleable. Used for allowing styling
       * @param {Ol.layer} layer Selected layer
       */
      layerIsStyleable() {
        return HsLayerUtilsService.layerIsStyleable($scope.olLayer());
      },
      /**
       * @function hasCopyright
       * @memberOf hs.layermanager.controller
       * @description Determines if layer has metadata information avaliable *
       * @param {Ol.layer} layer Selected layer (LayMan.currentLayer)
       */
      hasMetadata(layer) {
        if (!$scope.$ctrl.currentLayer) {
          return;
        } else {
          return layer.layer.get('MetadataURL') ? true : false;
        }
      },
      /**
       * @function hasCopyright
       * @memberOf hs.layermanager.controller
       * @description Determines if layer has copyright information avaliable *
       * @param {Ol.layer} layer Selected layer (LayMan.currentLayer)
       */
      hasCopyright(layer) {
        if (!$scope.$ctrl.currentLayer) {
          return;
        } else {
          if (layer.layer.get('Attribution')) {
            const attr = layer.layer.get('Attribution');
            return attr.OnlineResource ? true : false;
          } else {
            return false;
          }
        }
      },

      /**
       * @function minResolution
       * @memberOf hs.layermanager.controller
       * @description Set min resolution for selected layer
       * @param newValue
       */
      minResolution(newValue) {
        if (!$scope.$ctrl.currentLayer) {
          return;
        }
        const layer = $scope.olLayer();
        if (arguments.length) {
          layer.setMinResolution(newValue);
        } else {
          return layer.getMinResolution();
        }
      },

      /**
       * @function minResolution
       * @memberOf hs.layermanager.controller
       * @description Set max resolution for selected layer
       * @param newValue
       */
      maxResolution(newValue) {
        if (!$scope.$ctrl.currentLayer) {
          return;
        }
        const layer = $scope.olLayer();
        if (arguments.length) {
          layer.setMaxResolution(newValue);
        } else {
          return layer.getMaxResolution();
        }
      },

      /**
       * @function isLayerRemovable
       * @memberOf hs.layermanager.controller
       * @description Check if layer can be removed based on 'removable'
       * layer attribute
       */
      isLayerRemovable() {
        const layer = $scope.olLayer();
        return (
          angular.isDefined(layer) &&
          (angular.isUndefined(layer.get('removable')) ||
            layer.get('removable') == true)
        );
      },

      removeLayer() {
        if (HsDrawService.selectedLayer == $scope.olLayer()) {
          HsDrawService.selectedLayer = null;
        }
        HsMapService.map.removeLayer($scope.olLayer());
        HsDrawService.fillDrawableLayers();

        $rootScope.$broadcast('layermanager.updated'); //Rebuild the folder contents
      },

      saveStyle(layer) {
        setLayerStyle(layer);
      },

      /**
       * @function isScaleVisible
       * @memberOf hs.layermanager.controller
       * @param {Ol.layer} layer Selected layer
       * @description Test if layer has min and max relolution set
       */
      isScaleVisible() {
        const layer = $scope.olLayer();
        if (angular.isUndefined(layer)) {
          return false;
        }
        return $scope.minResolutionValid() || $scope.maxResolutionValid();
      },

      olLayer() {
        if (!$scope.$ctrl.currentLayer) {
          return undefined;
        }
        return $scope.$ctrl.currentLayer.layer;
      },

      minResolutionValid() {
        const layer = $scope.olLayer();
        if (angular.isUndefined(layer)) {
          return false;
        }
        return (
          angular.isDefined(layer.getMinResolution()) &&
          layer.getMinResolution() != 0
        );
      },

      maxResolutionValid() {
        const layer = $scope.olLayer();
        if (angular.isUndefined(layer)) {
          return false;
        }
        return (
          angular.isDefined(layer.getMaxResolution()) &&
          layer.getMaxResolution() != Infinity
        );
      },

      /**
       * @function title
       * @memberOf hs.layermanager.controller
       * @param {string} newTitle New title to set
       * @desription Change title of layer (Angular automatically change title in object wrapper but it is needed to manually change in Ol.layer object)
       * @returns {string} Title
       */
      title(newTitle) {
        const layer = $scope.olLayer();
        if (angular.isUndefined(layer)) {
          return false;
        }
        if (arguments.length) {
          $scope.$ctrl.currentLayer.title = newTitle;
          layer.set('title', newTitle);
        } else {
          return layer.get('title');
        }
      },

      abstract(newAbstract) {
        const layer = $scope.olLayer();
        if (angular.isUndefined(layer)) {
          return false;
        }
        if (arguments.length) {
          layer.set('abstract', newAbstract);
        } else {
          return layer.get('abstract');
        }
      },

      expandLayer(layer) {
        if (angular.isUndefined(layer.expanded)) {
          layer.expanded = true;
        } else {
          layer.expanded = !layer.expanded;
        }
      },

      expandSettings(layer, value) {
        if (angular.isUndefined(layer.opacity)) {
          layer.opacity = layer.layer.getOpacity();
        }
        if (
          angular.isUndefined(layer.style) &&
          layer.layer.getSource().styleAble
        ) {
          $scope.getLayerStyle(layer);
        }
        layer.expandSettings = value;
      },

      hasSubLayers() {
        if ($scope.$ctrl.currentLayer === null) {
          return;
        }
        const subLayers = $scope.$ctrl.currentLayer.layer.get('Layer');
        return angular.isDefined(subLayers) && subLayers.length > 0;
      },

      getSubLayers() {
        return HsLayerEditorSublayerService.getSubLayers();
      },

      expandFilter(layer, value) {
        layer.expandFilter = value;
        HsLayermanagerService.currentLayer = layer;
        $scope.currentLayer = HsLayermanagerService.currentLayer;
      },

      expandInfo(layer, value) {
        layer.expandInfo = value;
      },

      /**
       * @function dateToNonUtc
       * @memberOf hs.layermanager.controller
       * @param {Date} d Date to convert
       * @description Convert date to non Utc format
       * @returns {Date} Date with timezone added
       */
      dateToNonUtc(d) {
        if (angular.isUndefined(d)) {
          return;
        }
        const noutc = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
        return noutc;
      },
    });

    /**
     * @param wrapper
     */
    function setLayerStyle(wrapper) {
      //debugger;
      const layer = wrapper.layer;
      const source = layer.getSource();
      const style = wrapper.style.style;
      if (source.hasPoly) {
        style.setFill(
          new Fill({
            color: wrapper.style.fillColor,
          })
        );
      }
      if (source.hasLine || source.hasPoly) {
        style.setStroke(
          new Stroke({
            color: wrapper.style.lineColor,
            width: wrapper.style.lineWidth,
          })
        );
      }
      if (source.hasPoint) {
        let image;
        const stroke = new Stroke({
          color: wrapper.style.pointStroke,
          width: wrapper.style.pointWidth,
        });
        const fill = new Fill({
          color: wrapper.style.pointFill,
        });
        if (wrapper.style.pointType === 'Circle') {
          image = new Circle({
            stroke: stroke,
            fill: fill,
            radius: wrapper.style.radius,
            rotation: wrapper.style.rotation,
          });
        }
        if (wrapper.style.pointType === 'Polygon') {
          image = new RegularShape({
            stroke: stroke,
            fill: fill,
            radius: wrapper.style.radius,
            points: wrapper.style.pointPoints,
            rotation: wrapper.style.rotation,
          });
        }
        if (wrapper.style.pointType === 'Star') {
          image = new RegularShape({
            stroke: stroke,
            fill: fill,
            radius1: wrapper.style.radius,
            radius2: wrapper.style.radius2,
            points: wrapper.style.pointPoints,
            rotation: wrapper.style.rotation,
          });
        }
        style.setImage(image);
      }
      layer.setStyle(style);
    }

    $scope.getLayerStyle = function (wrapper) {
      const layer = wrapper.layer;
      const source = layer.getSource();
      wrapper.style = {};
      if (angular.isUndefined(layer.getStyle)) {
        return;
      }
      let style = layer.getStyle();
      if (typeof style == 'function') {
        style = style(source.getFeatures()[0]);
      }
      if (typeof style == 'object') {
        style = style[0];
      }
      style = style.clone();
      if (source.hasPoly) {
        wrapper.style.fillColor = style.getFill().getColor();
      }
      if (source.hasLine || source.hasPoly) {
        wrapper.style.lineColor = style.getStroke().getColor();
        wrapper.style.lineWidth = style.getStroke().getColor();
      }
      if (source.hasPoint) {
        const image = style.getImage();
        if (HsUtilsService.instOf(image, Circle)) {
          wrapper.style.pointType = 'Circle';
        } else if (HsUtilsService.instOf(image, RegularShape)) {
          wrapper.style.pointPoints = image.getPoints();
          wrapper.style.rotation = image.getRotation();
          if (angular.isUndefined(image.getRadius2())) {
            wrapper.style.pointType = 'Polygon';
          } else {
            wrapper.style.pointType = 'Star';
            wrapper.style.radius2 = image.getRadius2();
          }
        }
        if (
          HsUtilsService.instOf(image, Circle) ||
          HsUtilsService.instOf(image, RegularShape)
        ) {
          wrapper.style.radius = image.getRadius();
          wrapper.style.pointFill = image.getFill().getColor();
          wrapper.style.pointStroke = image.getStroke().getColor();
          wrapper.style.pointWidth = image.getStroke().getWidth();
        }
        if (angular.isUndefined(wrapper.style.radius2)) {
          wrapper.style.radius2 = wrapper.style.radius / 2;
        }
        if (angular.isUndefined(wrapper.style.pointPoints)) {
          wrapper.style.pointPoints = 4;
        }
        if (angular.isUndefined(wrapper.style.rotation)) {
          wrapper.style.rotation = Math.PI / 4;
        }
      }
      wrapper.style.style = style;
    };

    $scope.$watch('$ctrl.currentLayer', () => {
      if (!$scope.$ctrl.currentLayer) {
        return;
      }
      $scope.legendDescriptors = [
        HsLegendService.getLayerLegendDescriptor(
          $scope.$ctrl.currentLayer.layer
        ),
      ];
    });
  },
};
