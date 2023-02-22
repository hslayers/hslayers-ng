import {Injectable, NgZone} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import {Circle, Geometry} from 'ol/geom';
import {Cluster, Source} from 'ol/source';
import {DragBox, Draw, Modify, Snap} from 'ol/interaction';
import {DrawEvent} from 'ol/interaction/Draw';
import {Layer} from 'ol/layer';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {fromCircle} from 'ol/geom/Polygon';
import {platformModifierKeyOnly} from 'ol/events/condition';

import {EventsKey} from 'ol/events';
import {HsAddDataOwsService} from '../add-data/url/add-data-ows.service';
import {HsAddDataVectorService} from '../add-data/vector/vector.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsConfirmDialogComponent} from './../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsDrawServiceParams} from './draw.service.params';
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
import {unByKey} from 'ol/Observable';

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
  apps: {
    [id: string]: HsDrawServiceParams;
  } = {default: new HsDrawServiceParams()};

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

  get(app: string): HsDrawServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsDrawServiceParams();
    }
    return this.apps[app ?? 'default'];
  }
  /**
   * initial function if the draw panel is loaded as first panel
   */
  async init(_app: string): Promise<void> {
    const appRef = this.get(_app);
    await this.hsMapService.loaded(_app);
    const map = this.hsMapService.getMap(_app);
    this.fillDrawableLayers(_app);
    this.hsMapService.getLayersArray(_app).forEach((l) =>
      l.on('change:visible', (e) => {
        if (appRef.draw && l == appRef.selectedLayer) {
          this.setType(appRef.type, _app);
        }
        this.fillDrawableLayers(_app);
      })
    );

    appRef.modify = new Modify({
      features: appRef.selectedFeatures,
    });
    map.addInteraction(appRef.modify);

    appRef.selectedFeatures.on('add', (e) => {
      if (appRef.onSelected) {
        appRef.onSelected(e);
      }
      appRef.modify.setActive(true);
    });

    appRef.selectedFeatures.on('remove', (e) => {
      if (appRef.selectedFeatures.length == 0) {
        appRef.modify.setActive(false);
      }
    });

    this.hsEventBusService.vectorQueryFeatureSelection.subscribe((event) => {
      if (this.get(event.app) == appRef) {
        appRef.selectedFeatures.push(event.feature);
      }
    });

    this.hsEventBusService.vectorQueryFeatureDeselection.subscribe(
      ({feature, selector}) => {
        appRef.selectedFeatures.remove(feature);
      }
    );
    this.hsLaymanService.laymanLayerPending.subscribe((pendingLayers) => {
      appRef.pendingLayers = pendingLayers;
    });

    this.hsEventBusService.mapResets.subscribe(({app}) => {
      if (app == _app) {
        appRef.addedLayersRemoved = true;
        this.fillDrawableLayers(app);
      }
    });

    this.hsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      if (which === 'draw' && this.hsMapService.getMap(app)) {
        this.fillDrawableLayers(app);
      }
    });

    this.hsCommonLaymanService.authChange.subscribe(({endpoint}) => {
      this.fillDrawableLayers(_app);
      appRef.isAuthorized = endpoint?.authenticated;
      //When metadata dialog window opened. Layer is being added
      if (appRef.selectedLayer && appRef.tmpDrawLayer) {
        setWorkspace(appRef.selectedLayer, endpoint?.user);
        const definition = {
          format: appRef.isAuthorized ? 'hs.format.WFS' : null,
          url: appRef.isAuthorized
            ? this.hsCommonLaymanService.layman?.url + '/wfs'
            : null,
        };
        setDefinition(appRef.selectedLayer, definition);
      }
    });
  }
  /**
   * selectedLayerString
   * @returns Possibly translated name of layer selected for drawing
   */
  selectedLayerString(app: string): string {
    const appRef = this.get(app);
    if (appRef.selectedLayer) {
      const title = getTitle(appRef.selectedLayer);
      return title == TMP_LAYER_TITLE
        ? this.translate('DRAW.unsavedDrawing', app)
        : this.hsLayerUtilsService.translateTitle(title, app) ||
            getName(appRef.selectedLayer);
    } else {
      return this.translate('DRAW.Select layer', app);
    }
  }
  /**
   * snapLayerString
   * @returns Possibly translated name of layer selected for snapping
   */
  snapLayerString(app: string): string {
    const appRef = this.get(app);
    if (appRef.snapLayer) {
      const title = getTitle(appRef.snapLayer);
      return (
        this.hsLayerUtilsService.translateTitle(title, app) ||
        getName(appRef.snapLayer)
      );
    }
  }

  saveDrawingLayer(app: string): void {
    const appRef = this.get(app);
    if (appRef.selectedLayer) {
      appRef.previouslySelected = appRef.selectedLayer;
    }

    let tmpTitle = this.translate('DRAW.drawLayer', app);

    const tmpLayer = this.hsMapService.findLayerByTitle(TMP_LAYER_TITLE, app);
    const tmpSource = tmpLayer ? tmpLayer.getSource() : new VectorSource();

    let i = 1;
    while (this.hsMapService.findLayerByTitle(tmpTitle, app)) {
      tmpTitle = `${this.translate('DRAW.drawLayer', app)} ${i++}`;
    }
    const layman = this.hsCommonLaymanService.layman;
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
      format: appRef.isAuthorized ? 'hs.format.WFS' : null,
      url: appRef.isAuthorized ? layman.url + '/wfs' : null,
    });
    setWorkspace(drawLayer, layman?.user);
    appRef.tmpDrawLayer = true;
    appRef.selectedLayer = drawLayer;
    appRef.layerMetadataDialog.next();
  }

  setType(what, app: string): boolean {
    const appRef = this.get(app);

    if (appRef.type == what) {
      appRef.type = null;
      this.deactivateDrawing(app);
      const tmpLayer =
        this.hsMapService.findLayerByTitle(TMP_LAYER_TITLE, app) || null;
      if (tmpLayer) {
        this.hsMapService.getMap(app).removeLayer(tmpLayer);
        appRef.tmpDrawLayer = false;
      }
      this.hsQueryBaseService.activateQueries(app);
      return false;
    }
    //console.log(this.drawableLayers);
    //console.log(this.selectedLayer);
    if (appRef.drawableLayers.length == 0 && !appRef.tmpDrawLayer) {
      const drawLayer = new VectorLayer({
        source: new VectorSource(),
        visible: true,
      });
      setSld(drawLayer, defaultStyle);
      setTitle(drawLayer, TMP_LAYER_TITLE);
      setShowInLayerManager(drawLayer, false);
      setRemovable(drawLayer, true);
      setEditor(drawLayer, {editable: true});
      setPath(
        drawLayer,
        this.hsConfig.get(app).defaultDrawLayerPath || 'User generated'
      );
      appRef.tmpDrawLayer = true;
      appRef.selectedLayer = drawLayer;
      this.addDrawLayer(drawLayer, app);
    }
    appRef.type = what;
    if (appRef.selectedLayer) {
      appRef.source = this.hsLayerUtilsService.isLayerClustered(
        appRef.selectedLayer
      )
        ? (appRef.selectedLayer.getSource() as Cluster).getSource() //Is it clustered vector layer?
        : appRef.selectedLayer.getSource();
    }
    return true;
  }

  /**
   * Handles drawing layer selection/change by activating drawing for selected layer.
   * In case of Layman layer not yet existing in app it pulls the layer first.
   * @param layer -
   */
  async selectLayer(layer, app: string = 'default') {
    let metadata;
    let style;
    const appRef = this.get(app);

    if (!(layer instanceof Layer)) {
      metadata = await this.hsLaymanBrowserService.fillLayerMetadata(
        appRef.laymanEndpoint,
        layer,
        app
      );
    }
    if (metadata) {
      if (!metadata?.type?.includes('WFS')) {
        const dialog = this.hsDialogContainerService.create(
          HsConfirmDialogComponent,
          {
            message: this.translate('DRAW.thisLayerDoesNotSupportDrawing', app),
            title: this.translate('DRAW.notAVectorLayer', app),
          },
          app
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
          appRef.selectedLayer = null;
          this.fillDrawableLayers(app);
        }
        return;
      }
      if (metadata.style?.url) {
        style = await this.hsLaymanBrowserService.getStyleFromUrl(
          metadata.style?.url
        );
      }
      if (metadata.style?.type == 'sld') {
        if (!style?.includes('StyledLayerDescriptor')) {
          style = undefined;
        }
      }
      if (metadata.style?.type == 'qml') {
        if (!style?.includes('<qgis')) {
          style = undefined;
        }
      }
    }

    let lyr = layer;
    if (layer.workspace) {
      lyr = await this.hsAddDataVectorService.addVectorLayer(
        'wfs',
        appRef.laymanEndpoint.url,
        layer.name,
        layer.title,
        undefined,
        'EPSG:4326',
        {workspace: layer.workspace, saveToLayman: true, style: style},
        app
      );
      lyr = this.hsMapService.findLayerByTitle(layer.title, app);
    }
    if (lyr != appRef.selectedLayer) {
      if (
        appRef.selectedLayer &&
        getTitle(appRef.selectedLayer) == TMP_LAYER_TITLE
      ) {
        appRef.tmpDrawLayer = false;
        this.hsMapService.getMap(app).removeLayer(appRef.selectedLayer);
      }

      appRef.selectedLayer = lyr;
      this.changeDrawSource(app);
    }
    this.fillDrawableLayers(app);
  }
  /**
   * Add draw layer to the map and repopulate list of drawables.
   * @param layer -
   */
  addDrawLayer(layer: VectorLayer<VectorSource<Geometry>>, app: string): void {
    this.hsMapService.getMap(app).addLayer(layer);
    this.fillDrawableLayers(app);
  }

  /**
   * @param changeStyle - controller callback function
   * Update draw style without neccessity to reactivate drawing interaction
   */
  updateStyle(changeStyle, app: string): void {
    const appRef = this.get(app);

    if (appRef.draw) {
      appRef.currentStyle = changeStyle();
      appRef.draw.getOverlay().setStyle(appRef.currentStyle);
    }
  }

  onDrawEnd(e, app: string): void {
    const appRef = this.get(app);
    if (!getEditor(appRef.selectedLayer)) {
      return;
    }
    const editorConfig = getEditor(appRef.selectedLayer);
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
      this.addFeatureToSelector(e.feature, app);
    });
  }

  /**
   * Adds drawn feature to selection
   */
  addFeatureToSelector(feature, app: string) {
    //Zone is used to ensure change detection updates the view
    this.zone.run(() => {
      this.hsQueryBaseService.get(app).clear('features');
      this.hsQueryVectorService.init(app);
      this.hsQueryVectorService.apps[app].selector.getFeatures().push(feature);
      this.hsQueryVectorService.createFeatureAttributeList(app);
    });
  }

  /**
   * Re-enables getFeatureInfo info and cleans up after drawing
   */
  afterDrawEnd(app: string): void {
    const appRef = this.get(app);

    if (appRef.draw) {
      appRef.draw.setActive(false);
    }
    appRef.drawActive = false;
  }

  removeLastPoint(app: string): void {
    this.get(app).draw.removeLastPoint();
  }

  /**
   * Sets layer source where new drawing should be pushed to... after 'selectedLayer' change
   */
  changeDrawSource(app: string): void {
    const appRef = this.get(app);

    if (appRef.selectedLayer.getSource === undefined) {
      return;
    }
    appRef.source = this.hsLayerUtilsService.isLayerClustered(
      appRef.selectedLayer
    )
      ? (appRef.selectedLayer.getSource() as Cluster).getSource()
      : appRef.selectedLayer.getSource();

    appRef.drawingLayerChanges.next({
      layer: appRef.selectedLayer,
      source: appRef.source,
    });
    if (appRef.draw) {
      //Reactivate drawing with updated source
      this.activateDrawing(
        {
          drawState: true,
        },
        app
      );
      //Set snapLayer and snap interaction source
      appRef.snapLayer = appRef.selectedLayer;
      this.toggleSnapping(app, appRef.source);
    }
  }

  /**
   * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
   * @returns {Promise}
   */
  async deactivateDrawing(app: string): Promise<void> {
    const appRef = this.get(app);
    const map = await this.hsMapService.loaded(app);
    this.afterDrawEnd(app);
    if (appRef.draw) {
      for (const key of appRef.eventHandlers) {
        unByKey(key);
      }
      map.removeInteraction(appRef.draw);
      appRef.draw = null;
    }
  }

  stopDrawing(app: string): void {
    const appRef = this.get(app);

    if (!appRef.draw || appRef.draw === null) {
      return;
    }
    try {
      if (appRef.draw.getActive()) {
        appRef.draw.finishDrawing();
      }
    } catch (ex) {
      this.hsLogService.warn(ex);
    }
    appRef.draw.setActive(false);
    appRef.modify.setActive(false);
    this.hsQueryBaseService.activateQueries(app);
    appRef.type = null;
    appRef.drawActive = false;
  }

  startDrawing(app: string): void {
    const draw = this.get(app).draw;
    try {
      if (draw.getActive()) {
        draw.finishDrawing();
      }
    } catch (ex) {
      this.hsLogService.warn(ex);
    }
    draw.setActive(true);
  }

  /**
   * Repopulates drawable layers. In case layman connection exists it also creates
   * a list of available server possibilities.
   */
  async fillDrawableLayers(app: string): Promise<void> {
    const appRef = this.get(app);

    let drawables = [];
    await this.hsMapService.loaded(app);
    drawables = this.hsMapService
      .getMap(app)
      .getLayers()
      .getArray()
      .filter((layer: Layer<Source>) =>
        this.hsLayerUtilsService.isLayerDrawable(layer)
      );

    if (drawables.length == 0 && !appRef.tmpDrawLayer) {
      appRef.type = null;
      this.deactivateDrawing(app);
      appRef.selectedLayer = null;
      appRef.snapSource = null;
    } else if (drawables.length > 0) {
      if (this.selectedLayerNotAvailable(drawables, app)) {
        appRef.selectedLayer = drawables[0];
        this.changeDrawSource(app);
      }
    }
    appRef.addedLayersRemoved = false;
    appRef.drawableLayers = drawables;
    appRef.laymanEndpoint = this.hsCommonLaymanService.layman;
    if (appRef.laymanEndpoint) {
      await lastValueFrom(
        this.hsLaymanBrowserService.queryCatalog(appRef.laymanEndpoint, app, {
          onlyMine: appRef.onlyMine,
          limit: '',
          query: {},
        })
      );
      if (appRef.laymanEndpoint.layers) {
        appRef.drawableLaymanLayers = appRef.laymanEndpoint.layers.filter(
          (layer) => {
            return (
              !this.hsMapService.findLayerByTitle(layer.title, app) &&
              layer.editable
            );
          }
        );
      }
    }
    appRef.hasSomeDrawables =
      appRef.drawableLayers.length > 0 ||
      appRef.drawableLaymanLayers.length > 0;

    appRef.moreThenOneDrawable =
      appRef.drawableLayers?.length + appRef.drawableLaymanLayers?.length > 1;
  }

  private selectedLayerNotAvailable(drawables, app: string) {
    const appRef = this.get(app);
    if (appRef.addedLayersRemoved) {
      return true;
    } else {
      return (
        //Don't want to change after authChange when layer is being added
        (!appRef.tmpDrawLayer &&
          !drawables.some(
            (layer) =>
              appRef.selectedLayer &&
              getTitle(layer) == getTitle(appRef.selectedLayer)
          )) ||
        !appRef.selectedLayer
      );
    }
  }

  /**
   * Removes selected drawing layer from both Layermanager and Layman
   */
  async removeLayer(app: string): Promise<void> {
    const appRef = this.get(app);
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.translate('DRAW.reallyDeleteThisLayer', app),
        note: this.getDeleteNote(app),
        title: this.translate('COMMON.confirmDelete', app),
      },
      app
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      await this.completeLayerRemoval(appRef.selectedLayer, app);
      appRef.selectedLayer = null;
      this.fillDrawableLayers(app);
    }
  }

  /**
   * Removes multiple selected layers from both Layermanager and Layman
   */
  async removeMultipleLayers(app: string): Promise<void> {
    const appRef = this.get(app);
    const dialog = this.hsDialogContainerService.create(
      HsRmMultipleDialogComponent,
      {
        message: this.translate('DRAW.pleaseCheckTheLayers', app),
        note: this.getDeleteNote(app, true),
        title: this.translate('COMMON.selectAndConfirmToDeleteMultiple', app),
        items: [
          ...(appRef.drawableLayers ?? []),
          ...(appRef.drawableLaymanLayers ?? []),
        ],
        app,
      },
      app
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.hsToastService.createToastPopupMessage(
        this.translate('LAYMAN.deleteLayersRequest', app),
        this.translate('LAYMAN.deletionInProgress', app),
        {
          toastStyleClasses: 'bg-info text-white',
          serviceCalledFrom: 'HsDrawService',
          disableLocalization: true,
          customDelay: 600000,
        },
        app
      );
      const drawableLaymanRm = appRef.drawableLaymanLayers.filter(
        (l) => l.toRemove
      );
      const drawableRm = appRef.drawableLayers.filter((l) => l.toRemove);

      if (
        drawableLaymanRm?.length == appRef.drawableLaymanLayers?.length &&
        appRef.drawableLaymanLayers?.length != 0
      ) {
        await this.hsLaymanService.removeLayer(app);
        for (const l of drawableRm) {
          await this.completeLayerRemoval(l, app);
        }
      } else {
        const toRemove = [...drawableRm, ...drawableLaymanRm];
        for (const l of toRemove) {
          await this.completeLayerRemoval(l, app);
        }
      }
      appRef.selectedLayer = null;
      this.fillDrawableLayers(app);
    }
  }

  private async completeLayerRemoval(
    layerToRemove: any,
    app: string
  ): Promise<void> {
    let definition;
    const isLayer = layerToRemove instanceof Layer;
    if (isLayer) {
      this.hsMapService.getMap(app).removeLayer(layerToRemove);
      definition = getDefinition(layerToRemove);
      if (getTitle(layerToRemove) == TMP_LAYER_TITLE) {
        this.get(app).tmpDrawLayer = false;
      }
    }
    if (
      (definition?.format?.toLowerCase().includes('wfs') && definition?.url) ||
      !isLayer
    ) {
      await this.hsLaymanService.removeLayer(app, layerToRemove);
    }
  }

  getDeleteNote(app: string, plural?: boolean): string {
    return this.get(app).isAuthorized
      ? this.translate(
          plural ? 'DRAW.deleteNotePlural' : 'DRAW.deleteNote',
          app
        )
      : '';
  }

  /**
   * @param event -
   */
  keyUp(event, app: string) {
    if (event.key == 'Backspace') {
      this.removeLastPoint(app);
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
          this.removeLastPoint(app);
        }
        this.get(app).draw.finishDrawing();
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
  async activateDrawing(
    {
      onDrawStart,
      onDrawEnd = (e, app) => this.onDrawEnd(e, app),
      onSelected,
      onDeselected,
      drawState = true,
    }: activateParams,
    app: string = 'default'
  ): Promise<void> {
    const appRef = this.get(app);
    appRef.onDeselected = onDeselected;
    appRef.onSelected = onSelected;
    await this.deactivateDrawing(app);
    this.hsQueryBaseService.deactivateQueries(app);
    const drawInteraction = new Draw({
      source: appRef.source,
      type: /** GeometryType */ appRef.type,
      condition: (e) => {
        if (e.originalEvent.buttons === 1) {
          //left click
          return true;
        } else if (e.originalEvent.buttons === 2) {
          //right click
          if (appRef.type == 'Polygon') {
            const vertexCount = (appRef.draw as any).sketchLineCoords_?.length;
            return this.rightClickCondition(4, vertexCount, app);
          } else if (appRef.type == 'LineString') {
            const vertexCount = (appRef.draw as any).sketchCoords_?.length;
            return this.rightClickCondition(2, vertexCount - 1, app);
          }
        }
      },
    });

    this.setInteraction(drawInteraction, app);
    appRef.draw.setActive(drawState);
    this.addHandler(
      appRef,
      drawInteraction.on('drawstart', (e: DrawEvent) => {
        this.checkForMatchingSymbolizer(app);
        if (onDrawStart) {
          onDrawStart(e);
        }
      })
    );

    this.addHandler(
      appRef,
      drawInteraction.on('drawend', (e: DrawEvent) => {
        if (appRef.type == 'Circle') {
          e.feature.setGeometry(fromCircle(e.feature.getGeometry() as Circle));
        }
        if (onDrawEnd) {
          onDrawEnd(e, app);
        }
      })
    );

    //Add snap interaction -  must be added after the Modify and Draw interactions
    const snapSourceToBeUsed = appRef.snapSource
      ? appRef.snapSource
      : appRef.source;
    this.toggleSnapping(app, snapSourceToBeUsed);
  }

  /**
   * Register event handlers on draw interactions, so they can be unsubscribed after
   */
  addHandler(appRef: HsDrawServiceParams, e: EventsKey) {
    appRef.eventHandlers.push(e);
  }

  /**
   * Add draw interaction on map and set some enhancements on it which dont depend on activateDrawing function
   * @param interaction
   * @param app
   * @param active
   */
  async setInteraction(interaction: Draw, app: string): Promise<void> {
    const appRef = this.get(app);
    appRef.draw = interaction;
    const map = await this.hsMapService.loaded(app);
    map.addInteraction(interaction);

    this.addHandler(
      appRef,
      interaction.on('drawstart', (e: DrawEvent) => {
        if (this.hsUtilsService.runningInBrowser()) {
          document.addEventListener('keyup', this.keyUp.bind(this, e, app));
        }
      })
    );

    this.addHandler(
      appRef,
      interaction.on('drawstart', () => {
        appRef.drawActive = true;
        appRef.modify.setActive(false);
      })
    );

    this.addHandler(
      appRef,
      interaction.on('drawend', (e: DrawEvent) => {
        if (this.hsUtilsService.runningInBrowser()) {
          document.removeEventListener('keyup', this.keyUp.bind(this, e, app));
        }
      })
    );
  }

  /**
   * Syntactic sugar for translating
   */
  private translate(key: string, app: string, params?: any): string {
    return this.hsLanguageService.getTranslation(key, params, app);
  }

  /**
   * Display warning if symbolizer for current geometry being drawn is not present on layer
   */
  private checkForMatchingSymbolizer(app: string) {
    const appRef = this.get(app);
    if (!this.hasRequiredSymbolizer(app)) {
      const stylingMissingHeader = this.translate('DRAW.stylingMissing', app);
      const txtPanelTitle = this.translate('PANEL_HEADER.LM', app);
      const stylingMissingWarning = this.translate(
        'DRAW.stylingMissingWarning',
        app,
        {
          type: appRef.type,
          symbolizer: appRef.requiredSymbolizer[appRef.type].join(' or '),
          panel: txtPanelTitle,
        }
      );
      this.hsToastService.createToastPopupMessage(
        stylingMissingHeader,
        `${stylingMissingWarning}`,
        {
          serviceCalledFrom: 'HsDrawService',
        },
        app
      );
    }
  }

  /**
   * Checks whether selected geometry can be properly visualized on selected layer
   */
  hasRequiredSymbolizer(app: string): boolean {
    const appRef = this.get(app);
    const sld = getSld(appRef.selectedLayer);
    return appRef.requiredSymbolizer[appRef.type].some((symbolizer) => {
      return sld.includes(`${symbolizer}Symbolizer`);
    });
  }

  /**
   * Handle snap interaction changes
   * Remove snap interaction if it already exists, recreate it if source is provided.
   */
  toggleSnapping(app: string, source?: VectorSource<Geometry>): void {
    const appRef = this.get(app);
    this.hsMapService.loaded(app).then((map) => {
      appRef.snapSource = source ? source : appRef.snapSource;
      if (appRef.snap) {
        map.removeInteraction(appRef.snap);
        // appRef.snapLayer = null;
      }
      if (appRef.snapActive && appRef.snapSource) {
        appRef.snap = new Snap({
          source: appRef.snapSource,
        });
        map.addInteraction(appRef.snap);
      }
    });
  }
  /**
   * Changes layer source of snap interaction
   */
  changeSnapSource(
    layer: VectorLayer<VectorSource<Geometry>>,
    app: string
  ): void {
    //isLayerClustered
    const snapSourceToBeUsed = this.hsLayerUtilsService.isLayerClustered(layer)
      ? (layer.getSource() as Cluster).getSource()
      : layer.getSource();
    this.get(app).snapLayer = layer;
    this.toggleSnapping(app, snapSourceToBeUsed);
  }

  /**
   * Selects or deselects all features in this.selectedLayer
   */
  selectAllFeatures(app: string): void {
    const appRef = this.get(app);
    const selectFeatures =
      appRef.selectedFeatures.getLength() !=
      appRef.selectedLayer.getSource().getFeatures().length;
    appRef.toggleSelectionString = selectFeatures
      ? 'deselectAllFeatures'
      : 'selectAllFeatures';
    this.hsQueryBaseService.apps[app].clear('features');
    this.hsQueryBaseService.get(app).selector.getFeatures().clear();

    if (selectFeatures) {
      this.hsQueryBaseService
        .get(app)
        .selector.getFeatures()
        .extend(appRef.selectedLayer.getSource().getFeatures());
    }
    this.hsQueryVectorService.createFeatureAttributeList(app);
  }

  toggleBoxSelection(app: string): void {
    const appRef = this.get(app);
    this.hsMapService.loaded(app).then((map) => {
      if (appRef.boxSelection) {
        map.removeInteraction(appRef.boxSelection);
      }
      if (appRef.boxSelectionActive) {
        appRef.boxSelection = new DragBox({
          condition: platformModifierKeyOnly,
        });
        map.addInteraction(appRef.boxSelection);

        appRef.boxSelection.on('boxend', () => {
          if (!appRef.selectedLayer) {
            return;
          }
          this.hsQueryBaseService.apps[app].clear('features');

          const extent = appRef.boxSelection.getGeometry().getExtent();
          appRef.selectedLayer
            .getSource()
            .forEachFeatureIntersectingExtent(extent, (feature) => {
              this.hsQueryBaseService
                .get(app)
                .selector.getFeatures()
                .push(feature);
            });

          this.hsQueryVectorService.createFeatureAttributeList(app);
        });

        appRef.boxSelection.on('boxstart' as any, () => {
          this.hsQueryBaseService.get(app).selector.getFeatures().clear();
        });
        this.hsToastService.createToastPopupMessage(
          this.translate('DRAW.boxSelectionActivated', app),
          `${this.translate('DRAW.useModifierToSelectWithBox', app, {
            platformModifierKey: 'CTRL/META',
          })}`,
          {
            toastStyleClasses: 'bg-info text-white',
            serviceCalledFrom: 'HsDrawService',
          },
          app
        );
      }
    });
  }
}
