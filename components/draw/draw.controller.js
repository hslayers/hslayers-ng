import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';

/**
 * @param $scope
 * @param HsConfig
 * @param HsDrawService
 * @param HsLayerUtilsService
 * @param HsQueryVectorService
 * @param $timeout
 * @param HsLayoutService
 * @param gettext
 * @param HsMapService
 */
export default function (
  $scope,
  HsConfig,
  HsDrawService,
  HsLayerUtilsService,
  HsQueryVectorService,
  $timeout,
  HsLayoutService,
  gettext,
  HsMapService
) {
  'ngInject';
  angular.extend($scope, {
    layoutService: HsLayoutService,
    service: HsDrawService,
    isLayerInManager: HsLayerUtilsService.isLayerInManager,
    hasLayerTitle: HsLayerUtilsService.hasLayerTitle,
    isLayerEditable: HsLayerUtilsService.isLayerEditable,
    isLayerDrawable: HsLayerUtilsService.isLayerDrawable,
    useIndividualStyle: true,
    opacity: 0.2,
    linewidth: 1,
    $scope,
    fillcolor: {'background-color': 'rgba(0, 153, 255, 1)'},
    defaultStyle: new Style({
      stroke: new Stroke({
        color: 'rgba(0, 153, 255, 1)',
        width: 1.25,
      }),
      fill: new Fill({
        color: 'rgba(255,255,255,0.4)',
      }),
      image: new Circle({
        radius: 5,
        fill: new Fill({
          color: 'rgba(255,255,255,0.4)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 153, 255, 1)',
          width: 1.25,
        }),
      }),
    }),
    setType(what) {
      if (HsDrawService.type == what) {
        HsDrawService.type = null;
        HsDrawService.deactivateDrawing();
        return;
      } else {
        if (
          HsDrawService.drawableLayers.length == 0 &&
          !HsDrawService.tmpDrawLayer
        ) {
          const drawLayer = new VectorLayer({
            title: 'tmpDrawLayer',
            source: new Vector(),
            show_in_manager: false,
            visible: true,
            removable: true,
            editable: true,
            synchronize: true,
            path: HsConfig.defaultDrawLayerPath || gettext('User generated'),
          });
          HsDrawService.tmpDrawLayer = true;
          HsDrawService.selectedLayer = drawLayer;
          HsDrawService.addDrawLayer(drawLayer);
        }
      }
      HsDrawService.type = what;
      HsDrawService.source = angular.isDefined(
        HsDrawService.selectedLayer.getSource().getSource
      )
        ? HsDrawService.selectedLayer.getSource().getSource() //Is it clustered vector layer?
        : (HsDrawService.source = HsDrawService.selectedLayer.getSource());
      /* Individual feature styling is only available when drawing
				is controlled in special panel not in toolbar */
      $scope.activateDrawing(
        HsLayoutService.panelVisible('draw') && $scope.useIndividualStyle
      );
    },
    activateDrawing(withStyle) {
      HsDrawService.activateDrawing({
        onDrawStart: $scope.onDrawStart, //Will add later
        onDrawEnd: HsDrawService.onDrawEnd,
        onSelected: $scope.onFeatureSelected, //Will add later
        onDeselected: $scope.onFeatureDeselected, //Will add later
        changeStyle: withStyle ? $scope.changeStyle : undefined,
        drawState: true, //Activate drawing immediately
      });
    },
    onDrawStart() {
      if (!$scope.$$phase) {
        $scope.$digest();
      }
    },
    finishDrawing() {
      HsDrawService.draw.finishDrawing();
    },
    removeLastPoint() {
      HsDrawService.removeLastPoint();
    },
    selectLayer(layer) {
      if (layer != HsDrawService.selectedLayer) {
        HsDrawService.selectedLayer = layer;
        HsDrawService.changeDrawSource();
      }
      $scope.layersExpanded = false;
    },
    selectedLayerString() {
      if (HsDrawService.selectedLayer) {
        return HsDrawService.selectedLayer.get('title') == 'tmpDrawLayer'
          ? 'Unsaved drawing'
          : HsDrawService.selectedLayer.get('title') ||
              HsDrawService.selectedLayer.get('name');
      } else {
        return gettext('Select layer');
      }
    },
    toggleDrawToolbar(e) {
      if (
        HsLayoutService.layoutElement.clientWidth > 767 &&
        HsLayoutService.layoutElement.clientWidth < 870 &&
        !$scope.drawToolbarExpanded
      ) {
        HsLayoutService.sidebarExpanded = false;
      }
      $scope.drawToolbarExpanded = !$scope.drawToolbarExpanded;
      if (!$scope.drawToolbarExpanded) {
        HsDrawService.stopDrawing();
      }
    },

    updateStyle() {
      HsDrawService.updateStyle($scope.changeStyle);
    },
    /**
     * @function changeStyle
     * @memberOf HsDrawController
     * @param {Event} e optional parameter passed when changeStyle is called
     * for 'ondrawend' event features
     * @description Dynamically create draw feature style according to parameters selected in
     * hs.styler.colorDirective
     * @returns {Array} Array of style definitions
     */
    changeStyle(e = null) {
      return [
        new Style({
          stroke: new Stroke({
            color: $scope.fillcolor['background-color'],
            width: $scope.linewidth,
          }),
          fill: new Fill({
            color:
              $scope.fillcolor['background-color'].slice(0, -2) +
              $scope.opacity +
              ')',
          }),
          image: new Circle({
            radius: 5,
            fill: new Fill({
              color:
                $scope.fillcolor['background-color'].slice(0, -2) +
                $scope.opacity +
                ')',
            }),
            stroke: new Stroke({
              color: $scope.fillcolor['background-color'],
              width: $scope.linewidth,
            }),
          }),
        }),
      ];
    },
    drawStyle() {
      return {
        'background-color':
          $scope.fillcolor['background-color'].slice(0, -2) +
          $scope.opacity +
          ')',
        border:
          $scope.linewidth + 'px solid ' + $scope.fillcolor['background-color'],
      };
    },

    onDrawEnd(e) {
      if (angular.isUndefined(HsDrawService.selectedLayer.get('editor'))) {
        return;
      }
      const editorConfig = HsDrawService.selectedLayer.get('editor');
      if (editorConfig.defaultAttributes) {
        angular.forEach(editorConfig.defaultAttributes, (value, key) => {
          e.feature.set(key, value);
        });
      }
      /*Timeout is necessary because features are not imediately
       * added to the layer and layer can't be retrieved from the
       * feature, so they don't appear in Info panel */
      $timeout(() => {
        HsLayoutService.setMainPanel('info');
        HsQueryVectorService.selector.getFeatures().push(e.feature);
        HsQueryVectorService.createFeatureAttributeList();
      });
    },
  });

  $scope.$emit('scope_loaded', 'DrawToolbar');
}
