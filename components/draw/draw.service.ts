import * as GeometryType from 'ol/geom/GeometryType';
import Collection from 'ol/Collection';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Draw, Modify} from 'ol/interaction';
import {Layer} from 'ol/layer';

import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialog-container.service';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata.component';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../core/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from '../query/query-base.service';
import {HsQueryVectorService} from '../query/query-vector.service';

import {Injectable} from '@angular/core';

interface activateParams {
  onDrawStart?;
  onDrawEnd?;
  onSelected?;
  onDeselected?;
  changeStyle?;
  drawState?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HsDrawService {
  drawableLayers: Array<any> = [];
  draw: Draw;
  modify: any;
  /**
   * @type {GeometryType}
   * @memberof HsDrawService
   */
  type: string; //string of type GeometryType
  selectedLayer: Layer;
  tmpDrawLayer: any;
  source: any;
  drawActive = false;
  selectedFeatures: any = new Collection();
  onSelected: any;
  currentStyle: any;
  defaultStyle: Style = new Style({
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
  });
  onDeselected: any;

  constructor(
    private HsMapService: HsMapService,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsEventBusService: HsEventBusService,
    private HsLayoutService: HsLayoutService,
    private HsDialogContainerService: HsDialogContainerService,
    private HsLogService: HsLogService,
    private HsConfig: HsConfig,
    private HsQueryBaseService: HsQueryBaseService,
    private HsQueryVectorService: HsQueryVectorService
  ) {
    this.HsMapService.loaded().then((map) => {
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

    this.HsEventBusService.vectorQueryFeatureSelection.subscribe((event) => {
      this.selectedFeatures.push(event.feature);
    });

    this.HsEventBusService.vectorQueryFeatureDeselection.subscribe((event) => {
      this.selectedFeatures.remove(event.feature);
    });
  }

  selectedLayerString(): string {
    if (this.selectedLayer) {
      return this.selectedLayer.get('title') == 'tmpDrawLayer'
        ? 'Unsaved drawing'
        : this.selectedLayer.get('title') || this.selectedLayer.get('name');
    } else {
      return 'Select layer';
    }
  }

  saveDrawingLayer(addNewLayer = false): void {
    let tmpTitle = 'Draw layer'; //this.gettext()
    const tmpLayer =
      addNewLayer === true
        ? null
        : this.HsMapService.findLayerByTitle('tmpDrawLayer');
    const tmpSource =
      addNewLayer === true ? new Vector() : tmpLayer.getSource();

    let i = 1;
    while (this.HsMapService.findLayerByTitle(tmpTitle)) {
      tmpTitle = `${'Draw layer'} ${i++}`;
    }
    const drawLayer = new VectorLayer({
      title: tmpTitle,
      source: tmpSource,
      show_in_manager: true,
      visible: true,
      removable: true,
      editable: true,
      synchronize: true,
      path: this.HsConfig.defaultDrawLayerPath || 'User generated',
    });
    this.selectedLayer = drawLayer;
    this.HsDialogContainerService.create(
      HsDrawLayerMetadataDialogComponent,
      this
    );
  }

  setType(what): boolean {
    if (this.type == what) {
      this.type = null;
      this.deactivateDrawing();
      const tmpLayer =
        this.HsMapService.findLayerByTitle('tmpDrawLayer') || null;
      if (tmpLayer) {
        this.HsMapService.map.removeLayer(tmpLayer);
        this.tmpDrawLayer = false;
      }
      return false;
    }
    //console.log(this.drawableLayers);
    //console.log(this.selectedLayer);
    if (this.drawableLayers.length == 0 && !this.tmpDrawLayer) {
      const drawLayer = new VectorLayer({
        title: 'tmpDrawLayer',
        source: new Vector(),
        show_in_manager: false,
        visible: true,
        removable: true,
        editable: true,
        synchronize: true,
        path: this.HsConfig.defaultDrawLayerPath || 'User generated',
      });
      this.tmpDrawLayer = true;
      this.selectedLayer = drawLayer;
      this.addDrawLayer(drawLayer);
    }
    this.type = what;
    this.source = this.HsLayerUtilsService.isLayerClustered(this.selectedLayer)
      ? this.selectedLayer.getSource().getSource() //Is it clustered vector layer?
      : this.selectedLayer.getSource();
    return true;
  }

  addDrawLayer(layer: Layer): void {
    this.HsMapService.map.addLayer(layer);
    this.fillDrawableLayers();
  }

  /**
   * @function updateStyle
   * @memberof HsDrawService
   * @param {Function} changeStyle controller callback function
   * @description Update draw style without neccessity to reactivate drawing interaction
   */
  updateStyle(changeStyle): void {
    if (this.draw) {
      this.currentStyle = changeStyle();
      this.draw.getOverlay().setStyle(this.currentStyle);
    }
  }

  /**
   * (PRIVATE) Helper function which returns currently selected style.
   * @private
   * @function useCurrentStyle
   * @memberof HsDrawService
   */
  useCurrentStyle() {
    if (!this.currentStyle) {
      this.currentStyle = this.defaultStyle;
    }
    return this.currentStyle;
  }

  onDrawEnd(e): void {
    if (!this.selectedLayer.get('editor')) {
      return;
    }
    const editorConfig = this.selectedLayer.get('editor');
    if (editorConfig.defaultAttributes) {
      for (const key in editorConfig.defaultAttributes) {
        const value = editorConfig.defaultAttributes[key];
        e.feature.set(key, value);
      }
    }
    /*Timeout is necessary because features are not imediately
     * added to the layer and layer can't be retrieved from the
     * feature, so they don't appear in Info panel */
    if (this.HsLayoutService.mainpanel != 'draw') {
      setTimeout(() => {
        this.HsLayoutService.setMainPanel('info');
        this.HsQueryVectorService.selector.getFeatures().push(e.feature);
        this.HsQueryVectorService.createFeatureAttributeList();
      });
    }
  }

  /**
   * Re-enables getFeatureInfo info and cleans up after drawing
   */
  afterDrawEnd(): void {
    if (this.draw) {
      this.draw.setActive(false);
    }
    this.drawActive = false;
    this.HsQueryBaseService.activateQueries();
  }

  removeLastPoint(): void {
    this.draw.removeLastPoint();
  }

  changeDrawSource(): void {
    if (this.HsLayerUtilsService.isLayerClustered(this.selectedLayer)) {
      this.source = this.selectedLayer.getSource().getSource();
    } else {
      this.source = this.selectedLayer.getSource();
    }
    if (this.draw) {
      this.activateDrawing({
        changeStyle: () => this.useCurrentStyle(),
        drawState: true,
        onDrawEnd: (e) => this.onDrawEnd(e),
      });
    }
  }

  /**
   * @function deactivateDrawing
   * @memberof HsDrawService
   * @returns {Promise}
   * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
   */
  deactivateDrawing(): Promise<undefined> {
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

  stopDrawing(): void {
    if (!this.draw || this.draw === null) {
      return;
    }
    try {
      if (this.draw.getActive()) {
        this.draw.finishDrawing();
      }
    } catch (ex) {
      this.HsLogService.warn(ex);
    }
    this.draw.setActive(false);
    this.modify.setActive(false);
  }

  startDrawing(): void {
    try {
      if (this.draw.getActive()) {
        this.draw.finishDrawing();
      }
    } catch (ex) {
      this.HsLogService.warn(ex);
    }
    this.draw.setActive(true);
  }

  fillDrawableLayers(): void {
    const drawables = this.HsMapService.map
      .getLayers()
      .getArray()
      .filter((layer) => this.HsLayerUtilsService.isLayerDrawable(layer));
    if (drawables.length > 0 && !this.selectedLayer) {
      this.selectedLayer = drawables[0];
    }
    if (drawables.length == 0 && !this.selectedLayer) {
      this.type = null;
      this.deactivateDrawing();
    }
    this.drawableLayers = drawables;
  }

  /**
   * @function activateDrawing
   * @memberof HsDrawService
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
    onDrawEnd = (e) => this.onDrawEnd(e),
    onSelected,
    onDeselected,
    changeStyle,
    drawState = true,
  }: activateParams): void {
    this.onDeselected = onDeselected;
    this.onSelected = onSelected;
    this.deactivateDrawing().then(() => {
      this.HsQueryBaseService.deactivateQueries();
      this.draw = new Draw({
        source: this.source,
        type: /** @type {GeometryType} */ this.type,
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
          document.addEventListener('keyup', keyUp);
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
          document.removeEventListener('keyup', keyUp);
        },
        this
      );
    });
  }
}
