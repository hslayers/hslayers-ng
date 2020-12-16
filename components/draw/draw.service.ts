import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Circle, Fill, Stroke, Style} from 'ol/style';
import {Draw, Modify} from 'ol/interaction';
import {HsAddLayersVectorService} from '../add-layers/vector/add-layers-vector.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsConfirmDialogComponent} from './../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata.component';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLaymanBrowserService} from '../datasource-selector/layman/layman.service';
import {HsLaymanService} from '../save-map/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from '../query/query-base.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Subject} from 'rxjs';
import {fromCircle} from 'ol/geom/Polygon';

type activateParams = {
  onDrawStart?;
  onDrawEnd?;
  onSelected?;
  onDeselected?;
  changeStyle?;
  drawState?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class HsDrawService {
  drawableLayers: Array<any> = [];
  drawableLaymanLayers: Array<any> = [];
  hasSomeDrawables: boolean;
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
  highlightDrawButton = false; // Toggles toolbar button 'Draw' class
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
  public drawingLayerChanges: Subject<{
    layer: BaseLayer;
    source: VectorSource;
  }> = new Subject();
  laymanEndpoint: any;
  previouslySelected: any;
  isAuthorized: boolean;

  constructor(
    public HsMapService: HsMapService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLogService: HsLogService,
    public HsConfig: HsConfig,
    public HsQueryBaseService: HsQueryBaseService,
    public HsQueryVectorService: HsQueryVectorService,
    public HsLaymanService: HsLaymanService,
    public HsLanguageService: HsLanguageService,
    public HsLaymanBrowserService: HsLaymanBrowserService,
    public HsAddLayersVectorService: HsAddLayersVectorService,
    public HsCommonLaymanService: HsCommonLaymanService
  ) {
    this.keyUp = this.keyUp.bind(this);
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

    this.HsEventBusService.mainPanelChanges.subscribe((event) => {
      if (event === 'draw' && this.HsMapService.map) {
        this.fillDrawableLayers();
      }
    });

    this.HsCommonLaymanService.authChange.subscribe((endpoint: any) => {
      this.fillDrawableLayers();
      this.isAuthorized =
        endpoint.user !== 'anonymous' && endpoint.user !== 'browser';
    });
  }

  selectedLayerString(): string {
    if (this.selectedLayer) {
      return this.selectedLayer.get('title') == 'tmpDrawLayer'
        ? this.HsLanguageService.getTranslation('DRAW.unsavedDrawing')
        : this.HsLayerUtilsService.translateTitle(
            this.selectedLayer.get('title')
          ) || this.selectedLayer.get('name');
    } else {
      return this.HsLanguageService.getTranslation('DRAW.Select layer');
    }
  }

  saveDrawingLayer(): void {
    this.previouslySelected = this.selectedLayer;
    let tmpTitle = this.HsLanguageService.getTranslation('DRAW.drawLayer');

    const tmpLayer = this.HsMapService.findLayerByTitle('tmpDrawLayer');
    const tmpSource = tmpLayer ? tmpLayer.getSource() : new VectorSource();

    let i = 1;
    while (this.HsMapService.findLayerByTitle(tmpTitle)) {
      tmpTitle = `${this.HsLanguageService.getTranslation(
        'DRAW.drawLayer'
      )} ${i++}`;
    }
    const layman = this.HsLaymanService.getLaymanEndpoint();
    const drawLayer = new VectorLayer({
      title: tmpTitle,
      source: tmpSource,
      show_in_manager: true,
      visible: true,
      removable: true,
      style: this.defaultStyle,
      editable: true,
      path: this.HsConfig.defaultDrawLayerPath || 'User generated',
      definition: {
        format: layman ? 'hs.format.WFS' : null,
        url: layman ? layman.url + '/wfs' : null,
      },
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
      this.HsQueryBaseService.activateQueries();
      return false;
    }
    //console.log(this.drawableLayers);
    //console.log(this.selectedLayer);
    if (this.drawableLayers.length == 0 && !this.tmpDrawLayer) {
      const drawLayer = new VectorLayer({
        title: 'tmpDrawLayer',
        source: new VectorSource(),
        show_in_manager: false,
        visible: true,
        removable: true,
        editable: true,
        path: this.HsConfig.defaultDrawLayerPath || 'User generated',
        zIndex: Infinity,
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

  /**
   * @param layer
   * @function selectLayer
   * @memberOf HsDrawService
   * @description Handles drawing layer selection/change by activating drawing for selected layer.
   * In case of layman layer not yet existing in app it pulls the layer first.
   */
  async selectLayer(layer) {
    let lyr = layer;
    if (layer.type) {
      lyr = await this.HsAddLayersVectorService.addVectorLayer(
        'wfs',
        this.laymanEndpoint.url,
        layer.name,
        layer.title,
        undefined,
        'EPSG:4326',
        undefined
      );
      lyr = this.HsMapService.findLayerByTitle(layer.title);
    }
    if (lyr != this.selectedLayer) {
      if (
        this.selectedLayer &&
        this.selectedLayer.get('title') == 'tmpDrawLayer'
      ) {
        this.tmpDrawLayer = false;
        this.HsMapService.map.removeLayer(this.selectedLayer);
      }

      this.selectedLayer = lyr;
      this.changeDrawSource();
    }
    this.fillDrawableLayers();
  }
  /**
   * @param layer
   * @function addDrawLayer
   * @memberOf HsDrawService
   * @description Add draw layer to the map and repopulate list of drawables.
   */
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
   *
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
    if (
      this.HsLayoutService.mainpanel != 'draw' &&
      this.HsConfig.openQueryPanelOnDrawEnd
    ) {
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
  }

  removeLastPoint(): void {
    this.draw.removeLastPoint();
  }
  /**
   * @function changeDrawSource
   * @memberOf HsDrawService
   * @description Sets layer source where new drawing should be pushed to... after 'selectedLayer' change
   */
  changeDrawSource(): void {
    if (this.selectedLayer.getSource === undefined) {
      return;
    }
    const isLayerClustered = this.HsLayerUtilsService.isLayerClustered(
      this.selectedLayer
    );
    if (isLayerClustered) {
      this.source = this.selectedLayer.getSource().getSource();
    } else {
      this.source = this.selectedLayer.getSource();
    }
    this.drawingLayerChanges.next({
      layer: this.selectedLayer,
      source: this.source,
    });
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
    this.HsQueryBaseService.activateQueries();
    this.type = null;
    this.drawActive = false;
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

  /**
   * @function fillDrawableLayers
   * @memberOf HsDrawService
   * @description Repopulates drawable layers. In case layman connection exists it also creates
   * a list of avaliable server possiblities.
   */

  fillDrawableLayers(): void {
    const drawables = this.HsMapService.map
      .getLayers()
      .getArray()
      .filter((layer) => this.HsLayerUtilsService.isLayerDrawable(layer));
    if (drawables.length == 0 && !this.tmpDrawLayer) {
      this.type = null;
      this.deactivateDrawing();
      this.selectedLayer = null;
    } else if (drawables.length > 0) {
      if (
        !drawables.some(
          (layer) => layer.get('title') == this.selectedLayer?.get('title')
        ) ||
        !this.selectedLayer
      ) {
        this.selectedLayer = drawables[0];
        this.changeDrawSource();
      }
    }

    this.drawableLayers = drawables;
    this.laymanEndpoint = this.HsLaymanService.getLaymanEndpoint();
    if (this.laymanEndpoint) {
      this.HsLaymanBrowserService.queryCatalog(this.laymanEndpoint);
      if (this.laymanEndpoint.layers) {
        this.drawableLaymanLayers = this.laymanEndpoint.layers.filter(
          (layer) => {
            return !this.HsMapService.findLayerByTitle(layer.title);
          }
        );
      }
    }
    this.hasSomeDrawables =
      this.drawableLayers.length > 0 || this.drawableLaymanLayers.length > 0;
  }
  /**
   * @function removeLayer
   * @memberOf HsDrawController
   * @description Removes selected drawing layer from both Layermanager and Layman
   */
  async removeLayer() {
    const dialog = this.HsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.HsLanguageService.getTranslation(
          'DRAW.reallyDeleteThisLayer'
        ),
        title: this.HsLanguageService.getTranslation('COMMON.confirmDelete'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.HsMapService.map.removeLayer(this.selectedLayer);
      if (this.selectedLayer.get('definition')?.format == 'hs.format.WFS') {
        this.HsLaymanService.removeLayer(this.selectedLayer);
      }
      if (this.selectedLayer.get('title') == 'tmpDrawLayer') {
        this.tmpDrawLayer = false;
      }
      this.selectedLayer = null;
      this.fillDrawableLayers();
    }
  }

  /**
   * @param event
   */
  keyUp(event) {
    if (event.keyCode === 8) {
      this.removeLastPoint();
    }
  }
  /**
   * @function rightClickCondition
   * @memberOf HsDrawService
   * @description Determines whether rightclick should finish the drawing or not
   * @param typeNum Number used in calculation of minimal number of vertexes. Depends on geom type (polygon/line)
   * @param vertexCount Number of vertexes the sketch has
   */
  rightClickCondition(typeNum: number, vertexCount: number): boolean {
    const minPoints = this.HsConfig.preserveLastSketchPoint ? 1 : 0;
    const minVertexCount = typeNum - minPoints;
    if (vertexCount >= minVertexCount) {
      setTimeout(() => {
        if (minPoints == 0) {
          this.removeLastPoint();
        }
        this.draw.finishDrawing();
      }, 250);
      return true;
    }
    return false;
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
        condition: (e) => {
          if (e.originalEvent.buttons === 1) {
            //left click
            return true;
          } else if (e.originalEvent.buttons === 2) {
            //right click
            if (this.type == 'Polygon') {
              const vertexCount = this.draw.sketchLineCoords_?.length;
              return this.rightClickCondition(4, vertexCount);
            } else if (this.type == 'LineString') {
              const vertexCount = this.draw.sketchCoords_?.length;
              return this.rightClickCondition(2, vertexCount - 1);
            }
          }
        },
      });

      this.draw.setActive(drawState);

      this.HsMapService.loaded().then((map) => {
        map.addInteraction(this.draw);
      });

      this.draw.on(
        'drawstart',
        (e) => {
          this.drawActive = true;
          this.modify.setActive(false);
          if (onDrawStart) {
            onDrawStart(e);
          }
          document.addEventListener('keyup', this.keyUp);
        },
        this
      );

      this.draw.on(
        'drawend',
        (e) => {
          if (this.type == 'Circle') {
            e.feature.setGeometry(fromCircle(e.feature.getGeometry()));
          }
          if (changeStyle) {
            e.feature.setStyle(changeStyle());
          }
          if (onDrawEnd) {
            onDrawEnd(e);
          }
          document.removeEventListener('keyup', this.keyUp);
        },
        this
      );
    });
  }
}
