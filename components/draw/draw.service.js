import Collection from 'ol/Collection';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Draw, Modify} from 'ol/interaction';

export default [
  'Core',
  'hs.utils.service',
  'config',
  'hs.map.service',
  'hs.laymanService',
  'hs.query.baseService',
  '$rootScope',
  'hs.utils.layerUtilsService',
  'gettext',
  '$log',
  '$document',
  'hs.layout.service',
  '$compile',
  function (
    Core,
    utils,
    config,
    hsMap,
    laymanService,
    queryBaseService,
    $rootScope,
    layerUtilsService,
    gettext,
    $log,
    $document,
    layoutService,
    $compile,
  ) {
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

      addDrawLayer($scope) {
        let tmpTitle = gettext('Draw layer');
        let i = 1;
        while (hsMap.findLayerByTitle(tmpTitle)) {
          tmpTitle = `${gettext('Draw layer')} ${i++}`;
        }
        const drawLayer = new VectorLayer({
          title: tmpTitle,
          source: new Vector(),
          show_in_manager: true,
          visible: true,
          removable: true,
          editable: true,
          synchronize: true,
          path: config.defaultDrawLayerPath || gettext('User generated'),
        });
        hsMap.map.addLayer(drawLayer);
        me.selectedLayer = drawLayer;
        const el = angular.element(
          '<hs.draw-layer-metadata layer="service.selectedLayer"></draw-layer-metadata>'
        );
        layoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)($scope);
      },

      drawableLayers() {
        if (hsMap.map) {
          const tmp = hsMap.map
            .getLayers()
            .getArray()
            .filter(layerUtilsService.isLayerDrawable);
          if (tmp.length > 0 && me.selectedLayer === null) {
            me.selectedLayer = tmp[0];
          } else if (tmp.length == 0) {
            me.selectedLayer = null;
          }
          return tmp;
        }
      },
      /**
       * @function updateStyle
       * @memberOf hs.draw.service
       * @param {function} changeStyle controller callback function
       * @description Update draw style without neccessity to reactivate drawing interaction
       */
      updateStyle(changeStyle) {
        if (me.draw) {
          me.draw.getOverlay().setStyle(changeStyle());
        }
      },
      /**
       * @function activateDrawing
       * @memberOf hs.draw.service
       * @param {function} onDrawStart Callback function called when drawing is started
       * @param {function} onDrawEnd Callback function called when drawing is finished
       * @param {function} onSelected Callback function called when feature is selected for modification
       * @param {function} onDeselected Callback function called when feature is deselected
       * @param {function} changeStyle controller callback function which set style
       * dynamically according to selected parameters
       * @param {Boolean} drawState Should drawing be set active when
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
          queryBaseService.deactivateQueries();
          me.draw = new Draw({
            source: me.source,
            type: /** @type {ol.geom.GeometryType} */ (me.type),
            style: changeStyle ? changeStyle() : undefined,
          });

          me.draw.setActive(drawState);

          hsMap.loaded().then((map) => {
            map.addInteraction(me.draw);
          });

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
              me.draw.setActive(false);
              me.drawActive = false;
              queryBaseService.activateQueries();
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

      removeLastPoint() {
        me.draw.removeLastPoint();
      },

      /**
       * @function deactivateDrawing
       * @memberOf hs.draw.service
       * @return {Promise}
       * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
       */
      deactivateDrawing() {
        return new Promise((resolve, reject) => {
          hsMap.loaded().then((map) => {
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
    });

    hsMap.loaded().then((map) => {
      me.modify = new Modify({
        features: me.selectedFeatures,
      });
      map.addInteraction(me.modify);
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
  },
];
