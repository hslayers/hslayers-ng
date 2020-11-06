import Collection from 'ol/Collection';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Draw, Modify} from 'ol/interaction';

/**
 * @param HsConfig
 * @param HsMapService
 * @param HsQueryBaseService
 * @param $rootScope
 * @param HsLayerUtilsService
 * @param gettext
 * @param $log
 * @param $document
 * @param HsLayoutService
 * @param $compile
 * @param $timeout
 * @param HsQueryVectorService
 * @param HsLaymanService
 * @param HsConfirmDialogService
 */
export default function (
  HsConfig,
  HsMapService,
  HsQueryBaseService,
  $rootScope,
  HsLayerUtilsService,
  gettext,
  $log,
  $document,
  HsLayoutService,
  $compile,
  $timeout,
  HsQueryVectorService,
  HsLaymanService,
  HsConfirmDialogService,
) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    draw: null,
    modify: null,
    type: null,
    selectedFeatures: new Collection(),
    selectedLayer: null,
    drawActive: false,
    highlighted_style(feature, resolution) {
      return [
        new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.4)',
          }),
          stroke: new Stroke({
            color: '#d00504',
            width: 2,
          }),
          image: new Circle({
            radius: 5,
            fill: new Fill({
              color: '#d11514',
            }),
            stroke: new Stroke({
              color: '#d00504',
              width: 2,
            }),
          }),
        }),
      ];
    },
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
    saveDrawingLayer($scope, addNewLayer = false) {
      me.previouslySelected = me.selectedLayer;
      let tmpTitle = gettext('Draw layer');
      const tmpLayer =
        addNewLayer === true
          ? null
          : HsMapService.findLayerByTitle('tmpDrawLayer');
      const tmpSource =
        addNewLayer === true ? new Vector() : tmpLayer.getSource();

      let i = 1;
      while (HsMapService.findLayerByTitle(tmpTitle)) {
        tmpTitle = `${gettext('Draw layer')} ${i++}`;
      }
      const drawLayer = new VectorLayer({
        title: tmpTitle,
        source: tmpSource,
        show_in_manager: true,
        visible: true,
        removable: true,
        editable: true,
        path: HsConfig.defaultDrawLayerPath || gettext('User generated'),
        definition: {
          format: 'hs.format.WFS',
          url: HsLaymanService.getLaymanEndpoint() + '/wfs',
        },
      });
      me.selectedLayer = drawLayer;
      const el = angular.element(
        '<hs.draw-layer-metadata layer="service.selectedLayer"></draw-layer-metadata>'
      );
      HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);
      $compile(el)($scope);
    },

    addDrawLayer(layer) {
      HsMapService.map.addLayer(layer);
      me.fillDrawableLayers();
    },

    drawableLayers: [],
    /**
     * @function updateStyle
     * @memberOf HsDrawService
     * @param {Function} changeStyle controller callback function
     * @description Update draw style without neccessity to reactivate drawing interaction
     */
    updateStyle(changeStyle) {
      if (me.draw) {
        me.currentStyle = changeStyle();
        me.draw.getOverlay().setStyle(me.currentStyle);
      }
    },
    /**
     * (PRIVATE) Helper function which returns currently selected style.
     *
     * @function useCurrentStyle
     * @memberOf HsDrawService
     */
    useCurrentStyle() {
      if (!me.currentStyle) {
        me.currentStyle = me.defaultStyle;
      }
      return me.currentStyle;
    },
    /**
     * @function activateDrawing
     * @memberOf HsDrawService
     * @param {object} options Options object
     * @param {Function} [options.onDrawStart] Callback function called when drawing is started
     * @param {Function} [options.onDrawEnd] Callback function called when drawing is finished
     * @param {Function} [options.onSelected] Callback function called when feature is selected for modification
     * @param {Function} [options.onDeselected] Callback function called when feature is deselected
     * @param {Function} [options.changeStyle] controller callback function which set style
     * dynamically according to selected parameters
     * @param {boolean} options.drawState Should drawing be set active when
     * creating the interactions
     * @description Add drawing interaction to map. Partial interactions are Draw, Modify and Select. Add Event listeners for drawstart, drawend and (de)selection of feature.
     */
    activateDrawing({
      onDrawStart,
      onDrawEnd,
      onSelected,
      onDeselected,
      changeStyle,
      drawState,
    }) {
      me.onDeselected = onDeselected;
      me.onSelected = onSelected;
      me.deactivateDrawing().then(() => {
        HsQueryBaseService.deactivateQueries();
        me.draw = new Draw({
          source: me.source,
          type: /** @type {ol.geom.GeometryType} */ (me.type),
          style: changeStyle ? changeStyle() : undefined,
          condition: (e) => {
            if (e.originalEvent.buttons === 1) {
              //left click
              return true;
            } else if (e.originalEvent.buttons === 2) {
              //right click
              if (me.type == 'Polygon' && me.draw.sketchLineCoords_) {
                const vertexCount = me.draw.sketchLineCoords_.length;
                return me.rightClickCondition(4, vertexCount);
              } else if (me.type == 'LineString' && me.draw.sketchCoords_) {
                const vertexCount = me.draw.sketchCoords_.length;
                return me.rightClickCondition(2, vertexCount - 1);
              }
              return false;
            }
          },
        });

        me.draw.setActive(drawState);

        HsMapService.loaded().then((map) => {
          map.addInteraction(me.draw);
        });

        /**
         * @param event
         */
        function keyUp(event) {
          if (event.keyCode === 8) {
            me.removeLastPoint();
          }
        }

        me.draw.on(
          'drawstart',
          (e) => {
            me.drawActive = true;
            me.modify.setActive(false);
            if (onDrawStart) {
              onDrawStart(e);
            }
            $document[0].addEventListener('keyup', keyUp);
          },
          this
        );

        me.draw.on(
          'drawend',
          (e) => {
            if (changeStyle) {
              e.feature.setStyle(changeStyle());
            }
            if (onDrawEnd) {
              onDrawEnd(e);
            }
            $document[0].removeEventListener('keyup', keyUp);
          },
          this
        );
      });
    },

    onDrawEnd(e) {
      if (angular.isUndefined(me.selectedLayer.get('editor'))) {
        return;
      }
      const editorConfig = me.selectedLayer.get('editor');
      if (editorConfig.defaultAttributes) {
        angular.forEach(editorConfig.defaultAttributes, (value, key) => {
          e.feature.set(key, value);
        });
      }
      /*Timeout is necessary because features are not imediately
       * added to the layer and layer can't be retrieved from the
       * feature, so they don't appear in Info panel */
      if (HsLayoutService.mainpanel != 'draw') {
        $timeout(() => {
          HsLayoutService.setMainPanel('info');
          HsQueryVectorService.selector.getFeatures().push(e.feature);
          HsQueryVectorService.createFeatureAttributeList();
        });
      }
    },

    /**
     * Re-enables getFeatureInfo info and cleans up after drawing
     */
    afterDrawEnd() {
      if (me.draw) {
        me.draw.setActive(false);
      }
      me.drawActive = false;
      HsQueryBaseService.activateQueries();
    },

    removeLastPoint() {
      me.draw.removeLastPoint();
      me.checkSketch();
    },
    /**
     * After the removal of sketch point checks wheather it was the last point or not
     * If all of the sketch points were deleted, finishes drawing and removes eventListener
     */
    checkSketch() {
      if (me.type === 'Polygon' && me.draw.sketchCoords_[0].length == 1) {
        me.draw.finishDrawing();
      } else if (
        me.type === 'LineString' &&
        me.draw.sketchCoords_.length == 1
      ) {
        me.draw.finishDrawing();
      }
    },
    changeDrawSource() {
      if (HsLayerUtilsService.isLayerClustered(me.selectedLayer)) {
        me.source = me.selectedLayer.getSource().getSource();
      } else {
        me.source = me.selectedLayer.getSource();
      }
      if (me.draw) {
        me.activateDrawing({
          changeStyle: me.useCurrentStyle,
          drawState: true,
          onDrawEnd: me.onDrawEnd,
        });
      }
    },
    /**
     * @function rightClickCondition
     * @memberOf HsDrawService
     * @description Determines whether rightclick should finish the drawing or not
     * @param typeNum Number used in calculation of minimal number of vertexes. Depends on geom type (polygon/line)
     * @param vertexCount Number of vertexes the sketch has
     */
    rightClickCondition(typeNum, vertexCount) {
      const minPoints = HsConfig.preserveLastSketchPoint ? 1 : 0;
      const minVertexCount = typeNum - minPoints;
      if (vertexCount >= minVertexCount) {
        setTimeout(() => {
          if (minPoints == 0) {
            me.removeLastPoint();
          }
          me.draw.finishDrawing();
        }, 250);
        return true;
      }
      return false;
    },
    /**
     * @function removeLayer
     * @memberOf HsDrawController
     * @description Removes selected drawing layer from both Layermanager and Layman
     */
    async removeLayer() {
      const confirmed = await HsConfirmDialogService.show(
        gettext('Really delete selected draw layer?'),
        gettext('Confirm delete')
      );
      if (confirmed == 'yes') {
        HsMapService.map.removeLayer(me.selectedLayer);
        if (HsLaymanService.isLayerSynchronizable(me.selectedLayer)) {
          HsLaymanService.removeLayer(this.selectedLayer);
        }
        if (me.selectedLayer.get('title') == 'tmpDrawLayer') {
          me.tmpDrawLayer = false;
        }
        me.selectedLayer = null;
        me.fillDrawableLayers();
      }
    },
    /**
     * @function deactivateDrawing
     * @memberOf HsDrawService
     * @returns {Promise}
     * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
     */
    deactivateDrawing() {
      return new Promise((resolve, reject) => {
        HsMapService.loaded().then((map) => {
          me.afterDrawEnd();
          if (me.draw) {
            map.removeInteraction(me.draw);
            me.draw = null;
          }
          resolve();
        });
      });
    },

    stopDrawing() {
      if (angular.isUndefined(me.draw) || me.draw === null) {
        return;
      }
      try {
        if (me.draw.getActive()) {
          me.draw.finishDrawing();
        }
      } catch (ex) {
        $log.warn(ex);
      }
      me.draw.setActive(false);
      me.modify.setActive(false);
    },

    startDrawing() {
      try {
        if (me.draw.getActive()) {
          me.draw.finishDrawing();
        }
      } catch (ex) {
        $log.warn(ex);
      }
      me.draw.setActive(true);
    },

    fillDrawableLayers() {
      const tmp = HsMapService.map
        .getLayers()
        .getArray()
        .filter(HsLayerUtilsService.isLayerDrawable);
      if (tmp.length > 0 && me.selectedLayer === null) {
        me.selectedLayer = tmp[0];
      }
      if (tmp.length == 0 && me.selectedLayer === null) {
        me.type = null;
        me.deactivateDrawing();
      }
      me.drawableLayers = tmp;
    },
  });

  HsMapService.loaded().then((map) => {
    me.modify = new Modify({
      features: me.selectedFeatures,
    });
    map.addInteraction(me.modify);
    me.fillDrawableLayers();
  });

  me.selectedFeatures.on('add', (e) => {
    if (me.onSelected) {
      me.onSelected(e);
    }
    me.modify.setActive(true);
  });

  me.selectedFeatures.on('remove', (e) => {
    if (me.onDeselected) {
      me.onDeselected(e);
    }
  });

  const unregisterFeatureSelected = $rootScope.$on(
    'vectorQuery.featureSelected',
    (e, feature) => {
      me.selectedFeatures.push(feature);
    }
  );

  const unregisterFeatureDeselected = $rootScope.$on(
    'vectorQuery.featureDelected',
    (e, feature) => {
      me.selectedFeatures.remove(feature);
    }
  );
  return me;
}
