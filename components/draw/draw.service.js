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
  $compile
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

    saveDrawingLayer($scope,addNewLayer = false) {
      let tmpTitle = gettext('Draw layer');
      let tmpLayer = addNewLayer === true ? null : HsMapService.findLayerByTitle('tmpDrawLayer');
      let tmpSource = addNewLayer === true ? new Vector() : tmpLayer.getSource();

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
        synchronize: true,
        path: HsConfig.defaultDrawLayerPath || gettext('User generated'),
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
        me.draw.getOverlay().setStyle(changeStyle());
      }
    },
    /**
     * @function activateDrawing
     * @memberOf HsDrawService
     * @param {Function} onDrawStart Callback function called when drawing is started
     * @param {Function} onDrawEnd Callback function called when drawing is finished
     * @param {Function} onSelected Callback function called when feature is selected for modification
     * @param {Function} onDeselected Callback function called when feature is deselected
     * @param {Function} changeStyle controller callback function which set style
     * dynamically according to selected parameters
     * @param {boolean} drawState Should drawing be set active when
     * creating the interactions
     * @description Add drawing interaction to map. Partial interactions are Draw, Modify and Select. Add Event listeners for drawstart, drawend and (de)selection of feature.
     */
    activateDrawing(
      onDrawStart,
      onDrawEnd,
      onSelected,
      onDeselected,
      changeStyle,
      drawState
    ) {
      me.onDeselected = onDeselected;
      me.onSelected = onSelected;
      me.deactivateDrawing().then(() => {
        HsQueryBaseService.deactivateQueries();
        me.draw = new Draw({
          source: me.source,
          type: /** @type {ol.geom.GeometryType} */ (me.type),
          style: changeStyle ? changeStyle() : undefined,
        });

        me.draw.setActive(drawState);

        HsMapService.loaded().then((map) => {
          map.addInteraction(me.draw);
        });

        /**
         * @param event
         */
        function keyUp(event) {
          if (event.keyCode === 27) {
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
      if (tmp.length == 0 && me.selectedLayer === null){
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
