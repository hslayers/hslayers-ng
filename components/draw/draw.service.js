import Collection from 'ol/Collection';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Draw, Modify} from 'ol/interaction';

export class HsDrawService {
  constructor(
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
    HsQueryVectorService
  ) {
    'ngInject';
    Object.assign(this, {
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
      HsEventBusService
    });

    Object.assign(this, {
      drawableLayers: [],
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
    });

    HsMapService.loaded().then((map) => {
      this.modify = new Modify({
        features: this.selectedFeatures,
      });
      map.addInteraction(this.modify);
      this.fillDrawableLayers();
    });

    this.selectedFeatures.on('add', (e) => {
      if (this.onSelected) {
        this.onSelected(e);
      }
      this.modify.setActive(true);
    });

    this.selectedFeatures.on('remove', (e) => {
      if (this.onDeselected) {
        this.onDeselected(e);
      }
    });

    HsEventBusService.vectorQueryFeatureSelection.subscribe((event) => {
      this.selectedFeatures.push(event.feature);
    });

    const unregisterFeatureDeselected = $rootScope.$on(
      'vectorQuery.featureDelected',
      (e, feature) => {
        this.selectedFeatures.remove(feature);
      }
    );
  }

  saveDrawingLayer($scope, addNewLayer = false) {
    let tmpTitle = this.gettext('Draw layer');
    const tmpLayer =
      addNewLayer === true
        ? null
        : this.HsMapService.findLayerByTitle('tmpDrawLayer');
    const tmpSource =
      addNewLayer === true ? new Vector() : tmpLayer.getSource();

    let i = 1;
    while (this.HsMapService.findLayerByTitle(tmpTitle)) {
      tmpTitle = `${this.gettext('Draw layer')} ${i++}`;
    }
    const drawLayer = new VectorLayer({
      title: tmpTitle,
      source: tmpSource,
      show_in_manager: true,
      visible: true,
      removable: true,
      editable: true,
      synchronize: true,
      path:
        this.HsConfig.defaultDrawLayerPath || this.gettext('User generated'),
    });
    this.selectedLayer = drawLayer;
    const el = angular.element(
      '<hs.draw-layer-metadata layer="service.selectedLayer"></draw-layer-metadata>'
    );
    this.HsLayoutService.contentWrapper
      .querySelector('.hs-dialog-area')
      .appendChild(el[0]);
    this.$compile(el)($scope);
  }

  addDrawLayer(layer) {
    this.HsMapService.map.addLayer(layer);
    this.fillDrawableLayers();
  }

  /**
   * @function updateStyle
   * @memberOf HsDrawService
   * @param {Function} changeStyle controller callback function
   * @description Update draw style without neccessity to reactivate drawing interaction
   */
  updateStyle(changeStyle) {
    if (this.draw) {
      this.currentStyle = changeStyle();
      this.draw.getOverlay().setStyle(this.currentStyle);
    }
  }

  /**
   * (PRIVATE) Helper function which returns currently selected style.
   *
   * @function useCurrentStyle
   * @memberOf HsDrawService
   */
  useCurrentStyle() {
    if (!this.currentStyle) {
      this.currentStyle = this.defaultStyle;
    }
    return this.currentStyle;
  }

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
    this.onDeselected = onDeselected;
    this.onSelected = onSelected;
    this.deactivateDrawing().then(() => {
      this.HsQueryBaseService.deactivateQueries();
      this.draw = new Draw({
        source: this.source,
        type: /** @type {ol.geom.GeometryType} */ (this.type),
        style: changeStyle ? changeStyle() : undefined,
      });

      this.draw.setActive(drawState);

      this.HsMapService.loaded().then((map) => {
        map.addInteraction(this.draw);
      });

      /**
       * @param event
       */
      function keyUp(event) {
        if (event.keyCode === 27) {
          this.removeLastPoint();
        }
      }

      this.draw.on(
        'drawstart',
        (e) => {
          this.drawActive = true;
          this.modify.setActive(false);
          if (onDrawStart) {
            onDrawStart(e);
          }
          this.$document[0].addEventListener('keyup', keyUp);
        },
        this
      );

      this.draw.on(
        'drawend',
        (e) => {
          if (changeStyle) {
            e.feature.setStyle(changeStyle());
          }
          if (onDrawEnd) {
            onDrawEnd(e);
          }
          this.$document[0].removeEventListener('keyup', keyUp);
        },
        this
      );
    });
  }

  onDrawEnd(e) {
    if (angular.isUndefined(this.selectedLayer.get('editor'))) {
      return;
    }
    const editorConfig = this.selectedLayer.get('editor');
    if (editorConfig.defaultAttributes) {
      angular.forEach(editorConfig.defaultAttributes, (value, key) => {
        e.feature.set(key, value);
      });
    }
    /*Timeout is necessary because features are not imediately
     * added to the layer and layer can't be retrieved from the
     * feature, so they don't appear in Info panel */
    if (this.HsLayoutService.mainpanel != 'draw') {
      this.$timeout(() => {
        this.HsLayoutService.setMainPanel('info');
        this.HsQueryVectorService.selector.getFeatures().push(e.feature);
        this.HsQueryVectorService.createFeatureAttributeList();
      });
    }
  }

  /**
   * Re-enables getFeatureInfo info and cleans up after drawing
   */
  afterDrawEnd() {
    if (this.draw) {
      this.draw.setActive(false);
    }
    this.drawActive = false;
    this.HsQueryBaseService.activateQueries();
  }

  removeLastPoint() {
    this.draw.removeLastPoint();
  }

  changeDrawSource() {
    if (this.HsLayerUtilsService.isLayerClustered(this.selectedLayer)) {
      this.source = this.selectedLayer.getSource().getSource();
    } else {
      this.source = this.selectedLayer.getSource();
    }
    if (this.draw) {
      this.activateDrawing({
        changeStyle: this.useCurrentStyle,
        drawState: true,
        onDrawEnd: this.onDrawEnd,
      });
    }
  }

  /**
   * @function deactivateDrawing
   * @memberOf HsDrawService
   * @returns {Promise}
   * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
   */
  deactivateDrawing() {
    return new Promise((resolve, reject) => {
      this.HsMapService.loaded().then((map) => {
        this.afterDrawEnd();
        if (this.draw) {
          map.removeInteraction(this.draw);
          this.draw = null;
        }
        resolve();
      });
    });
  }

  stopDrawing() {
    if (angular.isUndefined(this.draw) || this.draw === null) {
      return;
    }
    try {
      if (this.draw.getActive()) {
        this.draw.finishDrawing();
      }
    } catch (ex) {
      this.$log.warn(ex);
    }
    this.draw.setActive(false);
    this.modify.setActive(false);
  }

  startDrawing() {
    try {
      if (this.draw.getActive()) {
        this.draw.finishDrawing();
      }
    } catch (ex) {
      this.$log.warn(ex);
    }
    this.draw.setActive(true);
  }

  fillDrawableLayers() {
    const tmp = this.HsMapService.map
      .getLayers()
      .getArray()
      .filter((layer) => this.HsLayerUtilsService.isLayerDrawable(layer));
    if (tmp.length > 0 && this.selectedLayer === null) {
      this.selectedLayer = tmp[0];
    }
    if (tmp.length == 0 && this.selectedLayer === null) {
      this.type = null;
      this.deactivateDrawing();
    }
    this.drawableLayers = tmp;
  }
}
