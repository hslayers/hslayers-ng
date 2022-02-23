import {Injectable, NgZone} from '@angular/core';

import Collection from 'ol/Collection';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Cluster, Source} from 'ol/source';
import {DragBox, Draw, Modify, Snap} from 'ol/interaction';
import {DrawEvent} from 'ol/interaction/Draw';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Subject, lastValueFrom} from 'rxjs';
import {fromCircle} from 'ol/geom/Polygon';
import {platformModifierKeyOnly} from 'ol/events/condition';

import {HsAddDataOwsService} from '../add-data/url/add-data-ows.service';
import {HsAddDataVectorService} from '../add-data/vector/vector.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsConfirmDialogComponent} from './../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLaymanBrowserService} from '../add-data/catalogue/layman/layman.service';
import {HsLaymanService} from '../save-map/layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from '../query/query-base.service';
import {HsQueryVectorService} from '../query/query-vector.service';
import {HsRmMultipleDialogComponent} from '../../common/remove-multiple/remove-multiple-dialog.component';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {defaultStyle} from '../styles/styles';
import {
  getDefinition,
  getEditor,
  getName,
  getSld,
  getTitle,
  setDefinition,
  setEditor,
  setPath,
  setRemovable,
  setShowInLayerManager,
  setSld,
  setTitle,
  setWorkspace,
} from '../../common/layer-extensions';

type activateParams = {
  onDrawStart?;
  onDrawEnd?;
  onSelected?;
  onDeselected?;
  changeStyle?;
  drawState?: boolean;
};

const TMP_LAYER_TITLE = 'tmpDrawLayer';

@Injectable({
  providedIn: 'root',
})
export class HsDrawService {
  drawableLayers: Array<any> = [];
  drawableLaymanLayers: Array<any> = [];
  hasSomeDrawables = false;
  moreThenOneDrawable = false;
  draw: Draw;
  modify: Modify;

  boxSelection: DragBox;
  boxSelectionActive = false;
  //Snap interaction
  snap: Snap;
  snapActive = false;
  snapSource: VectorSource<Geometry>;
  snapLayer: VectorLayer<VectorSource<Geometry>>;

  type: 'Point' | 'Polygon' | 'LineString' | 'Circle'; //string of type GeometryType
  selectedLayer: VectorLayer<VectorSource<Geometry>>;
  tmpDrawLayer: any;
  source: VectorSource<Geometry>;
  drawActive = false;
  selectedFeatures: any = new Collection();
  toggleSelectionString = 'selectAllFeatures';
  onSelected: any;
  currentStyle: any;
  highlightDrawButton = false; // Toggles toolbar button 'Draw' class
  onDeselected: any;
  public drawingLayerChanges: Subject<{
    layer: Layer<Source>;
    source: VectorSource<Geometry>;
  }> = new Subject();
  laymanEndpoint: any;
  previouslySelected: any;
  isAuthorized: boolean;
  onlyMine = true;
  addedLayersRemoved = false;
  layerMetadataDialog: Subject<void> = new Subject();

  //Layer being loaded from layman (endpoint url pending)
  pendingLayers = [];

  requiredSymbolizer = {
    Point: ['Point'],
    Polygon: ['Fill', 'Line'],
    LineString: ['Line'],
    Circle: ['Fill', 'Line'],
  };

  constructor(
    public hsMapService: HsMapService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLogService: HsLogService,
    public hsConfig: HsConfig,
    public hsQueryBaseService: HsQueryBaseService,
    public hsQueryVectorService: HsQueryVectorService,
    public hsLaymanService: HsLaymanService,
    public hsLanguageService: HsLanguageService,
    public hsLaymanBrowserService: HsLaymanBrowserService,
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsUtilsService: HsUtilsService,
    public hsCommonLaymanService: HsCommonLaymanService,
    public hsToastService: HsToastService,
    public hsAddDataOwsService: HsAddDataOwsService,
    private zone: NgZone
  ) {
    this.keyUp = this.keyUp.bind(this);
  }
  /**
   * initial function if the draw panel is loaded as first panel
   */
  async init(app: string): Promise<void> {
    await this.hsMapService.loaded(app);
    const map = this.hsMapService.getMap(app);
    this.fillDrawableLayers(app);
    this.hsMapService.getLayersArray().forEach((l) =>
      l.on('change:visible', (e) => {
        if (this.draw && l == this.selectedLayer) {
          this.setType(this.type, app);
        }
        this.fillDrawableLayers(app);
      })
    );

    this.modify = new Modify({
      features: this.selectedFeatures,
    });
    map.addInteraction(this.modify);

    this.selectedFeatures.on('add', (e) => {
      if (this.onSelected) {
        this.onSelected(e);
      }
      this.modify.setActive(true);
    });

    this.selectedFeatures.on('remove', (e) => {
      if (this.selectedFeatures.length == 0) {
        this.modify.setActive(false);
      }
    });

    this.hsEventBusService.vectorQueryFeatureSelection.subscribe((event) => {
      this.selectedFeatures.push(event.feature);
    });

    this.hsEventBusService.vectorQueryFeatureDeselection.subscribe(
      ({feature, selector}) => {
        this.selectedFeatures.remove(feature);
      }
    );
    this.hsLaymanService.laymanLayerPending.subscribe((pendingLayers) => {
      this.pendingLayers = pendingLayers;
    });

    this.hsEventBusService.mapResets.subscribe(() => {
      this.addedLayersRemoved = true;
      this.fillDrawableLayers(app);
    });

    this.hsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      if (which === 'draw' && this.hsMapService.getMap()) {
        this.fillDrawableLayers(app);
      }
    });

    this.hsCommonLaymanService.authChange.subscribe((endpoint: any) => {
      this.fillDrawableLayers(app);
      this.isAuthorized = endpoint.authenticated;
      //When metadata dialog window opened. Layer is being added
      if (this.selectedLayer && this.tmpDrawLayer) {
        setWorkspace(this.selectedLayer, endpoint.user);
        const definition = {
          format: this.isAuthorized ? 'hs.format.WFS' : null,
          url: this.isAuthorized
            ? this.hsLaymanService.getLaymanEndpoint().url + '/wfs'
            : null,
        };
        setDefinition(this.selectedLayer, definition);
      }
    });
  }
  /**
   * selectedLayerString
   * @returns Possibly translated name of layer selected for drawing
   */
  selectedLayerString(): string {
    if (this.selectedLayer) {
      const title = getTitle(this.selectedLayer);
      return title == TMP_LAYER_TITLE
        ? this.hsLanguageService.getTranslation('DRAW.unsavedDrawing')
        : this.hsLayerUtilsService.translateTitle(title) ||
            getName(this.selectedLayer);
    } else {
      return this.hsLanguageService.getTranslation('DRAW.Select layer');
    }
  }
  /**
   * snapLayerString
   * @returns Possibly translated name of layer selected for snapping
   */
  snapLayerString(): string {
    if (this.snapLayer) {
      const title = getTitle(this.snapLayer);
      return (
        this.hsLayerUtilsService.translateTitle(title) ||
        getName(this.snapLayer)
      );
    }
  }

  saveDrawingLayer(app: string): void {
    if (this.selectedLayer) {
      this.previouslySelected = this.selectedLayer;
    }

    let tmpTitle = this.hsLanguageService.getTranslation('DRAW.drawLayer');

    const tmpLayer = this.hsMapService.findLayerByTitle(TMP_LAYER_TITLE);
    const tmpSource = tmpLayer ? tmpLayer.getSource() : new VectorSource();

    let i = 1;
    while (this.hsMapService.findLayerByTitle(tmpTitle)) {
      tmpTitle = `${this.hsLanguageService.getTranslation(
        'DRAW.drawLayer'
      )} ${i++}`;
    }
    const layman = this.hsLaymanService.getLaymanEndpoint();
    const drawLayer = new VectorLayer({
      //TODO: Also name should be set, but take care in case a layer with that name already exists in layman
      source: tmpSource,
      visible: true,
    });
    setTitle(drawLayer, tmpTitle);
    setShowInLayerManager(drawLayer, true);
    setRemovable(drawLayer, true);
    setSld(drawLayer, defaultStyle);
    setEditor(drawLayer, {editable: true});
    setPath(
      drawLayer,
      this.hsConfig.get(app).defaultDrawLayerPath || 'User generated'
    ); //TODO: Translate this
    setDefinition(drawLayer, {
      format: this.isAuthorized ? 'hs.format.WFS' : null,
      url: this.isAuthorized ? layman.url + '/wfs' : null,
    });
    setWorkspace(drawLayer, layman?.user);
    this.tmpDrawLayer = true;
    this.selectedLayer = drawLayer;
    this.layerMetadataDialog.next();
  }

  setType(what, app: string): boolean {
    if (this.type == what) {
      this.type = null;
      this.deactivateDrawing();
      const tmpLayer =
        this.hsMapService.findLayerByTitle(TMP_LAYER_TITLE) || null;
      if (tmpLayer) {
        this.hsMapService.getMap().removeLayer(tmpLayer);
        this.tmpDrawLayer = false;
      }
      this.hsQueryBaseService.activateQueries(app);
      return false;
    }
    //console.log(this.drawableLayers);
    //console.log(this.selectedLayer);
    if (this.drawableLayers.length == 0 && !this.tmpDrawLayer) {
      const drawLayer = new VectorLayer({
        source: new VectorSource(),
        visible: true,
      });
      setTitle(drawLayer, TMP_LAYER_TITLE);
      setShowInLayerManager(drawLayer, false);
      setRemovable(drawLayer, true);
      setEditor(drawLayer, {editable: true});
      setPath(
        drawLayer,
        this.hsConfig.get(app).defaultDrawLayerPath || 'User generated'
      );
      this.tmpDrawLayer = true;
      this.selectedLayer = drawLayer;
      this.addDrawLayer(drawLayer, app);
    }
    this.type = what;
    if (this.selectedLayer) {
      this.source = this.hsLayerUtilsService.isLayerClustered(
        this.selectedLayer
      )
        ? (this.selectedLayer.getSource() as Cluster).getSource() //Is it clustered vector layer?
        : this.selectedLayer.getSource();
    }
    return true;
  }

  /**
   * Handles drawing layer selection/change by activating drawing for selected layer.
   * In case of Layman layer not yet existing in app it pulls the layer first.
   * @param layer -
   */
  async selectLayer(layer, app: string) {
    let metadata;
    if (!(layer instanceof Layer)) {
      metadata = await this.hsLaymanBrowserService.fillLayerMetadata(
        this.laymanEndpoint,
        layer
      );
    }
    if (metadata && !metadata?.type?.includes('WFS')) {
      const dialog = this.hsDialogContainerService.create(
        HsConfirmDialogComponent,
        {
          message: this.hsLanguageService.getTranslation(
            'DRAW.thisLayerDoesNotSupportDrawing'
          ),
          title: this.hsLanguageService.getTranslation('DRAW.notAVectorLayer'),
        }
      );
      const confirmed = await dialog.waitResult();
      if (confirmed == 'yes') {
        await this.hsAddDataOwsService.connectToOWS(
          {
            type: 'wms',
            uri: decodeURIComponent(metadata.wms.url),
            layer: layer.name,
          },
          app
        );
        this.selectedLayer = null;
        this.fillDrawableLayers(app);
      }
      return;
    }

    let lyr = layer;
    if (layer.workspace) {
      lyr = await this.hsAddDataVectorService.addVectorLayer(
        'wfs',
        this.laymanEndpoint.url,
        layer.name,
        layer.title,
        undefined,
        'EPSG:4326',
        {workspace: layer.workspace}
      );
      lyr = this.hsMapService.findLayerByTitle(layer.title);
    }
    if (lyr != this.selectedLayer) {
      if (
        this.selectedLayer &&
        getTitle(this.selectedLayer) == TMP_LAYER_TITLE
      ) {
        this.tmpDrawLayer = false;
        this.hsMapService.getMap().removeLayer(this.selectedLayer);
      }

      this.selectedLayer = lyr;
      this.changeDrawSource(app);
    }
    this.fillDrawableLayers(app);
  }
  /**
   * Add draw layer to the map and repopulate list of drawables.
   * @param layer -
   */
  addDrawLayer(layer: VectorLayer<VectorSource<Geometry>>, app: string): void {
    this.hsMapService.getMap().addLayer(layer);
    this.fillDrawableLayers(app);
  }

  /**
   * @param changeStyle - controller callback function
   * Update draw style without neccessity to reactivate drawing interaction
   */
  updateStyle(changeStyle): void {
    if (this.draw) {
      this.currentStyle = changeStyle();
      this.draw.getOverlay().setStyle(this.currentStyle);
    }
  }

  onDrawEnd(e, app: string): void {
    if (!getEditor(this.selectedLayer)) {
      return;
    }
    const editorConfig = getEditor(this.selectedLayer);
    if (editorConfig.defaultAttributes) {
      for (const key in editorConfig.defaultAttributes) {
        const value = editorConfig.defaultAttributes[key];
        e.feature.set(key, value);
      }
    }
    /*Timeout is necessary because features are not immediately
     * added to the layer and layer can't be retrieved from the
     * feature, so they don't appear in Info panel */
    if (
      this.hsLayoutService.get(app).mainpanel != 'draw' &&
      this.hsConfig.get(app).openQueryPanelOnDrawEnd
    ) {
      this.hsLayoutService.setMainPanel('info', app);
    }
    setTimeout(() => {
      this.addFeatureToSelector(e.feature);
    });
  }

  /**
   * Adds drawn feature to selection
   */
  addFeatureToSelector(feature) {
    //Zone is used to ensure change detection updates the view
    this.zone.run(() => {
      this.hsQueryBaseService.clearData('features');
      this.hsQueryVectorService.selector.getFeatures().push(feature);
      this.hsQueryVectorService.createFeatureAttributeList();
    });
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
   * Sets layer source where new drawing should be pushed to... after 'selectedLayer' change
   */
  changeDrawSource(app: string): void {
    if (this.selectedLayer.getSource === undefined) {
      return;
    }
    this.source = this.hsLayerUtilsService.isLayerClustered(this.selectedLayer)
      ? (this.selectedLayer.getSource() as Cluster).getSource()
      : this.selectedLayer.getSource();

    this.drawingLayerChanges.next({
      layer: this.selectedLayer,
      source: this.source,
    });
    if (this.draw) {
      //Reactivate drawing with updated source
      this.activateDrawing(
        {
          drawState: true,
          onDrawEnd: (e) => this.onDrawEnd(e, app),
        },
        app
      );
      //Set snapLayer and snap interaction source
      this.snapLayer = this.selectedLayer;
      this.toggleSnapping(this.source);
    }
  }

  /**
   * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
   * @returns {Promise}
   */
  deactivateDrawing(): Promise<undefined> {
    return new Promise((resolve, reject) => {
      this.hsMapService.loaded().then((map) => {
        this.afterDrawEnd();
        if (this.draw) {
          map.removeInteraction(this.draw);
          this.draw = null;
        }
        resolve(null);
      });
    });
  }

  stopDrawing(app: string): void {
    if (!this.draw || this.draw === null) {
      return;
    }
    try {
      if (this.draw.getActive()) {
        this.draw.finishDrawing();
      }
    } catch (ex) {
      this.hsLogService.warn(ex);
    }
    this.draw.setActive(false);
    this.modify.setActive(false);
    this.hsQueryBaseService.activateQueries(app);
    this.type = null;
    this.drawActive = false;
  }

  startDrawing(): void {
    try {
      if (this.draw.getActive()) {
        this.draw.finishDrawing();
      }
    } catch (ex) {
      this.hsLogService.warn(ex);
    }
    this.draw.setActive(true);
  }

  /**
   * Repopulates drawable layers. In case layman connection exists it also creates
   * a list of available server possibilities.
   */
  async fillDrawableLayers(app: string): Promise<void> {
    let drawables = [];
    await this.hsMapService.loaded();
    drawables = this.hsMapService
      .getMap()
      .getLayers()
      .getArray()
      .filter((layer: Layer<Source>) =>
        this.hsLayerUtilsService.isLayerDrawable(layer)
      );

    if (drawables.length == 0 && !this.tmpDrawLayer) {
      this.type = null;
      this.deactivateDrawing();
      this.selectedLayer = null;
      this.snapSource = null;
    } else if (drawables.length > 0) {
      if (this.selectedLayerNotAvailable(drawables)) {
        this.selectedLayer = drawables[0];
        this.changeDrawSource(app);
      }
    }
    this.addedLayersRemoved = false;
    this.drawableLayers = drawables;
    this.laymanEndpoint = this.hsLaymanService.getLaymanEndpoint();
    if (this.laymanEndpoint) {
      await lastValueFrom(
        this.hsLaymanBrowserService.queryCatalog(this.laymanEndpoint, {
          onlyMine: this.onlyMine,
          limit: '',
          query: {},
        })
      );
      if (this.laymanEndpoint.layers) {
        this.drawableLaymanLayers = this.laymanEndpoint.layers.filter(
          (layer) => {
            return (
              !this.hsMapService.findLayerByTitle(layer.title) && layer.editable
            );
          }
        );
      }
    }
    this.hasSomeDrawables =
      this.drawableLayers.length > 0 || this.drawableLaymanLayers.length > 0;

    this.moreThenOneDrawable =
      this.drawableLayers?.length + this.drawableLaymanLayers?.length > 1;
  }

  private selectedLayerNotAvailable(drawables) {
    if (this.addedLayersRemoved) {
      return true;
    } else {
      return (
        //Don't want to change after authChange when layer is being added
        (!this.tmpDrawLayer &&
          !drawables.some(
            (layer) =>
              this.selectedLayer &&
              getTitle(layer) == getTitle(this.selectedLayer)
          )) ||
        !this.selectedLayer
      );
    }
  }

  /**
   * Removes selected drawing layer from both Layermanager and Layman
   */
  async removeLayer(app: string): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.hsLanguageService.getTranslation(
          'DRAW.reallyDeleteThisLayer'
        ),
        note: this.getDeleteNote(),
        title: this.hsLanguageService.getTranslation('COMMON.confirmDelete'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      await this.completeLayerRemoval(this.selectedLayer);
      this.selectedLayer = null;
      this.fillDrawableLayers(app);
    }
  }

  /**
   * Removes multiple selected layers from both Layermanager and Layman
   */
  async removeMultipleLayers(app: string): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsRmMultipleDialogComponent,
      {
        message: this.hsLanguageService.getTranslation(
          'DRAW.pleaseCheckTheLayers'
        ),
        note: this.getDeleteNote(true),
        title: this.hsLanguageService.getTranslation(
          'COMMON.selectAndConfirmToDeleteMultiple'
        ),
        items: [
          ...(this.drawableLayers ?? []),
          ...(this.drawableLaymanLayers ?? []),
        ],
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation('LAYMAN.deleteLayersRequest'),
        this.hsLanguageService.getTranslation('LAYMAN.deletionInProgress'),
        {
          toastStyleClasses: 'bg-info text-white',
          serviceCalledFrom: 'HsDrawService',
          disableLocalization: true,
          customDelay: 600000,
        }
      );
      const drawableLaymanRm = this.drawableLaymanLayers.filter(
        (l) => l.toRemove
      );
      const drawableRm = this.drawableLayers.filter((l) => l.toRemove);

      if (
        drawableLaymanRm?.length == this.drawableLaymanLayers?.length &&
        this.drawableLaymanLayers?.length != 0
      ) {
        await this.hsLaymanService.removeLayer();
        for (const l of drawableRm) {
          await this.completeLayerRemoval(l);
        }
      } else {
        const toRemove = [...drawableRm, ...drawableLaymanRm];
        for (const l of toRemove) {
          await this.completeLayerRemoval(l);
        }
      }
      this.selectedLayer = null;
      this.fillDrawableLayers(app);
    }
  }

  private async completeLayerRemoval(layerToRemove: any): Promise<void> {
    let definition;
    const isLayer = layerToRemove instanceof Layer;
    if (isLayer) {
      this.hsMapService.getMap().removeLayer(layerToRemove);
      definition = getDefinition(layerToRemove);
      if (getTitle(layerToRemove) == TMP_LAYER_TITLE) {
        this.tmpDrawLayer = false;
      }
    }
    if (
      (definition?.format?.toLowerCase().includes('wfs') && definition?.url) ||
      !isLayer
    ) {
      await this.hsLaymanService.removeLayer(layerToRemove.name);
    }
  }

  getDeleteNote(plural?: boolean): string {
    return this.isAuthorized
      ? this.hsLanguageService.getTranslation(
          plural ? 'DRAW.deleteNotePlural' : 'DRAW.deleteNote'
        )
      : '';
  }

  /**
   * @param event -
   */
  keyUp(event) {
    if (event.key == 'Backspace') {
      this.removeLastPoint();
    }
  }

  /**
   * Determines whether rightclick should finish the drawing or not
   * @param typeNum - Number used in calculation of minimal number of vertexes. Depends on geom type (polygon/line)
   * @param vertexCount - Number of vertexes the sketch has
   * @returns return boolean value if right mouse button was clicked
   */
  rightClickCondition(
    typeNum: number,
    vertexCount: number,
    app: string
  ): boolean {
    const minPoints = this.hsConfig.get(app).preserveLastSketchPoint ? 1 : 0;
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
   * @param options - Options object
   * @param onDrawStart - Callback function called when drawing is started
   * @param onDrawEnd - Callback function called when drawing is finished
   * @param onSelected - Callback function called when feature is selected for modification
   * @param onDeselected - Callback function called when feature is deselected
   * @param changeStyle - controller callback function which set style
   * dynamically according to selected parameters
   * @param drawState - Should drawing be set active when
   * creating the interactions
   * Add drawing interaction to map. Partial interactions are Draw, Modify and Select. Add Event listeners for drawstart, drawend and (de)selection of feature.
   */
  activateDrawing(
    {
      onDrawStart,
      onDrawEnd = (e, app) => this.onDrawEnd(e, app),
      onSelected,
      onDeselected,
      drawState = true,
    }: activateParams,
    app: string
  ): void {
    this.onDeselected = onDeselected;
    this.onSelected = onSelected;
    this.deactivateDrawing().then(() => {
      this.hsQueryBaseService.deactivateQueries(app);
      this.draw = new Draw({
        source: this.source,
        type: /** GeometryType */ this.type,
        condition: (e) => {
          if (e.originalEvent.buttons === 1) {
            //left click
            return true;
          } else if (e.originalEvent.buttons === 2) {
            //right click
            if (this.type == 'Polygon') {
              const vertexCount = (this.draw as any).sketchLineCoords_?.length;
              return this.rightClickCondition(4, vertexCount, app);
            } else if (this.type == 'LineString') {
              const vertexCount = (this.draw as any).sketchCoords_?.length;
              return this.rightClickCondition(2, vertexCount - 1, app);
            }
          }
        },
      });

      this.draw.setActive(drawState);
      this.hsMapService.loaded().then((map) => {
        map.addInteraction(this.draw);
      });

      this.draw.on('drawstart', (e: DrawEvent) => {
        if (!this.hasRequiredSymbolizer()) {
          this.hsToastService.createToastPopupMessage(
            this.hsLanguageService.getTranslation('DRAW.stylingMissing'),
            `${this.hsLanguageService.getTranslation(
              'DRAW.stylingMissingWarning',
              {
                type: this.type,
                symbolizer: this.requiredSymbolizer[this.type].join(' or '),
                panel: this.hsLanguageService.getTranslation('PANEL_HEADER.LM'),
              }
            )}`,
            {
              serviceCalledFrom: 'HsDrawService',
            }
          );
        }
        this.drawActive = true;
        this.modify.setActive(false);
        if (onDrawStart) {
          onDrawStart(e);
        }
        if (this.hsUtilsService.runningInBrowser()) {
          document.addEventListener('keyup', this.keyUp);
        }
      });

      this.draw.on('drawend', (e: DrawEvent) => {
        if (this.type == 'Circle') {
          e.feature.setGeometry(fromCircle(e.feature.getGeometry()));
        }
        if (onDrawEnd) {
          onDrawEnd(e);
        }
        if (this.hsUtilsService.runningInBrowser()) {
          document.removeEventListener('keyup', this.keyUp);
        }
      });

      //Add snap interaction -  must be added after the Modify and Draw interactions
      const snapSourceToBeUsed = this.snapSource
        ? this.snapSource
        : this.source;
      this.toggleSnapping(snapSourceToBeUsed);
    });
  }

  /**
   * Checks whether selected geometry can be properly visualized on selected layer
   */
  hasRequiredSymbolizer(): boolean {
    const sld = getSld(this.selectedLayer);
    return this.requiredSymbolizer[this.type].some((symbolizer) => {
      return sld.includes(`${symbolizer}Symbolizer`);
    });
  }

  /**
   * Handle snap interaction changes
   * Remove snap interaction if it already exists, recreate it if source is provided.
   */
  toggleSnapping(source?: VectorSource<Geometry>): void {
    this.hsMapService.loaded().then((map) => {
      this.snapSource = source ? source : this.snapSource;
      if (this.snap) {
        map.removeInteraction(this.snap);
        // this.snapLayer = null;
      }
      if (this.snapActive && this.snapSource) {
        this.snap = new Snap({
          source: this.snapSource,
        });
        map.addInteraction(this.snap);
      }
    });
  }
  /**
   * Changes layer source of snap interaction
   */
  changeSnapSource(layer: VectorLayer<VectorSource<Geometry>>): void {
    //isLayerClustered
    const snapSourceToBeUsed = this.hsLayerUtilsService.isLayerClustered(layer)
      ? (layer.getSource() as Cluster).getSource()
      : layer.getSource();
    this.snapLayer = layer;
    this.toggleSnapping(snapSourceToBeUsed);
  }

  /**
   * Selects or deselects all features in this.selectedLayer
   */
  selectAllFeatures(): void {
    const selectFeatures =
      this.selectedFeatures.getLength() !=
      this.selectedLayer.getSource().getFeatures().length;
    this.toggleSelectionString = selectFeatures
      ? 'deselectAllFeatures'
      : 'selectAllFeatures';
    this.hsQueryBaseService.clearData('features');
    this.hsQueryBaseService.selector.getFeatures().clear();

    if (selectFeatures) {
      this.hsQueryBaseService.selector
        .getFeatures()
        .extend(this.selectedLayer.getSource().getFeatures());
    }
    this.hsQueryVectorService.createFeatureAttributeList();
  }

  toggleBoxSelection(): void {
    this.hsMapService.loaded().then((map) => {
      if (this.boxSelection) {
        map.removeInteraction(this.boxSelection);
      }
      if (this.boxSelectionActive) {
        this.boxSelection = new DragBox({
          condition: platformModifierKeyOnly,
        });
        map.addInteraction(this.boxSelection);

        this.boxSelection.on('boxend', () => {
          if (!this.selectedLayer) {
            return;
          }
          this.hsQueryBaseService.clearData('features');

          const extent = this.boxSelection.getGeometry().getExtent();
          this.selectedLayer
            .getSource()
            .forEachFeatureIntersectingExtent(extent, (feature) => {
              this.hsQueryBaseService.selector.getFeatures().push(feature);
            });

          this.hsQueryVectorService.createFeatureAttributeList();
        });

        this.boxSelection.on('boxstart' as any, () => {
          this.hsQueryBaseService.selector.getFeatures().clear();
        });
        this.hsToastService.createToastPopupMessage(
          this.hsLanguageService.getTranslation('DRAW.boxSelectionActivated'),
          `${this.hsLanguageService.getTranslation(
            'DRAW.useModifierToSelectWithBox',
            {
              platformModifierKey: 'CTRL/META',
            }
          )}`,
          {
            toastStyleClasses: 'bg-info text-white',
            serviceCalledFrom: 'HsDrawService',
          }
        );
      }
    });
  }
}
