import {Injectable, NgZone} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import {Circle} from 'ol/geom';
import {Cluster, Source, Vector as VectorSource} from 'ol/source';
import {DragBox, Draw, Modify, Snap} from 'ol/interaction';
import {DrawEvent} from 'ol/interaction/Draw';
// eslint-disable-next-line import/named
import {EventsKey} from 'ol/events';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {fromCircle} from 'ol/geom/Polygon';
import {platformModifierKeyOnly} from 'ol/events/condition';
import {unByKey} from 'ol/Observable';

import {HsAddDataOwsService} from 'hslayers-ng/components/add-data';
import {HsAddDataVectorService} from 'hslayers-ng/components/add-data';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawServiceParams} from './draw.service.params';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLaymanBrowserService} from 'hslayers-ng/components/add-data';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsQueryBaseService} from 'hslayers-ng/components/query';
import {HsQueryVectorService} from 'hslayers-ng/components/query';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {defaultStyle} from 'hslayers-ng/components/styler';
import {
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
} from 'hslayers-ng/common/extensions';

type ActivateParams = {
  onDrawStart?;
  onDrawEnd?;
  onSelected?;
  onDeselected?;
  changeStyle?;
  drawState?: boolean;
};

export const TMP_LAYER_TITLE = 'tmpDrawLayer';

@Injectable({
  providedIn: 'root',
})
export class HsDrawService extends HsDrawServiceParams {
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
    private zone: NgZone,
  ) {
    super();
    this.keyUp = this.keyUp.bind(this);
    this.hsMapService.loaded().then((map) => {
      this.fillDrawableLayers();
      this.hsMapService.getLayersArray().forEach((l) =>
        l.on('change:visible', (e) => {
          if (this.draw && l == this.selectedLayer) {
            this.setType(this.type);
          }
          this.fillDrawableLayers();
        }),
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
        },
      );
      this.hsLaymanService.laymanLayerPending.subscribe((pendingLayers) => {
        this.pendingLayers = pendingLayers;
      });

      this.hsEventBusService.mapResets.subscribe(() => {
        this.addedLayersRemoved = true;
        this.fillDrawableLayers();
      });

      this.hsLayoutService.mainpanel$.subscribe((which) => {
        if (which === 'draw' && this.hsMapService.getMap()) {
          this.fillDrawableLayers();
        }
      });

      this.hsCommonLaymanService.authChange.subscribe((endpoint) => {
        this.fillDrawableLayers();
        this.isAuthenticated = endpoint?.authenticated;
        //When metadata dialog window opened. Layer is being added
        if (this.selectedLayer && this.tmpDrawLayer) {
          setWorkspace(this.selectedLayer, endpoint?.user);
          const definition = {
            format: this.isAuthenticated ? 'hs.format.WFS' : null,
            url: this.isAuthenticated
              ? this.hsCommonLaymanService.layman?.url + '/wfs'
              : null,
          };
          setDefinition(this.selectedLayer, definition);
        }
      });
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
        ? this.translate('DRAW.unsavedDrawing')
        : this.hsLayerUtilsService.translateTitle(title) ||
            getName(this.selectedLayer);
    } else {
      return this.translate('DRAW.Select layer');
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

  saveDrawingLayer(): void {
    if (this.selectedLayer) {
      this.previouslySelected = this.selectedLayer;
    }

    let tmpTitle = this.translate('DRAW.drawLayer');

    const tmpLayer = this.hsMapService.findLayerByTitle(TMP_LAYER_TITLE);
    const tmpSource = tmpLayer ? tmpLayer.getSource() : new VectorSource();

    let i = 1;
    while (this.hsMapService.findLayerByTitle(tmpTitle)) {
      tmpTitle = `${this.translate('DRAW.drawLayer')} ${i++}`;
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
    setPath(drawLayer, this.hsConfig.defaultDrawLayerPath || 'User generated');
    setDefinition(drawLayer, {
      format: this.isAuthenticated ? 'hs.format.WFS' : null,
      url: this.isAuthenticated ? layman.url + '/wfs' : null,
    });
    setWorkspace(drawLayer, layman?.user);
    this.tmpDrawLayer = true;
    this.selectedLayer = drawLayer;
    this.layerMetadataDialog.next();
  }

  setType(what): boolean {
    if (this.type == what) {
      this.type = null;
      this.deactivateDrawing();
      const tmpLayer =
        this.hsMapService.findLayerByTitle(TMP_LAYER_TITLE) || null;
      if (tmpLayer) {
        this.hsMapService.getMap().removeLayer(tmpLayer);
        this.tmpDrawLayer = false;
      }
      this.hsQueryBaseService.activateQueries();
      return false;
    }
    //console.log(this.drawableLayers);
    //console.log(this.selectedLayer);
    if (this.drawableLayers.length == 0 && !this.tmpDrawLayer) {
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
        this.hsConfig.defaultDrawLayerPath || 'User generated',
      );
      this.tmpDrawLayer = true;
      this.selectedLayer = drawLayer;
      this.addDrawLayer(drawLayer);
    }
    this.type = what;
    if (this.selectedLayer) {
      this.source = this.hsLayerUtilsService.isLayerClustered(
        this.selectedLayer,
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
  async selectLayer(layer) {
    let metadata;
    let style;

    if (!(layer instanceof Layer)) {
      metadata = await this.hsLaymanBrowserService.fillLayerMetadata(
        this.laymanEndpoint,
        layer,
      );
    }
    if (metadata) {
      if (!metadata?.type?.includes('WFS')) {
        const dialog = this.hsDialogContainerService.create(
          HsConfirmDialogComponent,
          {
            message: this.translate('DRAW.thisLayerDoesNotSupportDrawing'),
            title: this.translate('DRAW.notAVectorLayer'),
          },
        );
        const confirmed = await dialog.waitResult();
        if (confirmed == 'yes') {
          await this.hsAddDataOwsService.connectToOWS({
            type: 'wms',
            uri: decodeURIComponent(metadata.wms.url),
            layer: layer.name,
          });
          this.selectedLayer = null;
          this.fillDrawableLayers();
        }
        return;
      }
      if (metadata.style?.url) {
        style = await this.hsCommonLaymanService.getStyleFromUrl(
          metadata.style?.url,
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
        this.laymanEndpoint.url,
        layer.name,
        layer.title,
        undefined,
        'EPSG:4326',
        {workspace: layer.workspace, saveToLayman: true, style: style},
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
      this.changeDrawSource();
    }
    this.fillDrawableLayers();
  }
  /**
   * Add draw layer to the map and repopulate list of drawables.
   * @param layer -
   */
  addDrawLayer(layer: VectorLayer<VectorSource>): void {
    this.hsMapService.getMap().addLayer(layer);
    this.fillDrawableLayers();
  }

  /**
   * @param changeStyle - controller callback function
   * Update draw style without necessity to reactivate drawing interaction
   */
  updateStyle(changeStyle): void {
    if (this.draw) {
      this.currentStyle = changeStyle();
      this.draw.getOverlay().setStyle(this.currentStyle);
    }
  }

  onDrawEnd(e): void {
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
      this.hsLayoutService.mainpanel != 'draw' &&
      this.hsConfig.openQueryPanelOnDrawEnd
    ) {
      this.hsLayoutService.setMainPanel('query');
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
      this.hsQueryBaseService.clear('features');
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
  changeDrawSource(): void {
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
      this.activateDrawing({
        drawState: true,
      });
      //Set snapLayer and snap interaction source
      this.snapLayer = this.selectedLayer;
      this.toggleSnapping(this.source);
    }
  }

  /**
   * Deactivate all hs.draw interaction in map (Draw, Modify, Select)
   */
  async deactivateDrawing(): Promise<void> {
    const map = await this.hsMapService.loaded();
    this.afterDrawEnd();
    if (this.draw) {
      for (const key of this.eventHandlers) {
        unByKey(key);
      }
      map.removeInteraction(this.draw);
      this.draw = null;
    }
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
      this.hsLogService.warn(ex);
    }
    this.draw.setActive(false);
    this.modify.setActive(false);
    this.hsQueryBaseService.activateQueries();
    this.type = null;
    this.drawActive = false;
  }

  startDrawing(): void {
    const draw = this.draw;
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
  async fillDrawableLayers(): Promise<void> {
    let drawables = [];
    await this.hsMapService.loaded();
    drawables = this.hsMapService
      .getMap()
      .getLayers()
      .getArray()
      .filter((layer: Layer<Source>) =>
        this.hsLayerUtilsService.isLayerDrawable(layer),
      );

    if (drawables.length == 0 && !this.tmpDrawLayer) {
      this.type = null;
      this.deactivateDrawing();
      this.selectedLayer = null;
      this.snapSource = null;
    } else if (drawables.length > 0) {
      if (this.selectedLayerNotAvailable(drawables)) {
        this.selectedLayer = drawables[0];
        this.changeDrawSource();
      }
    }
    this.addedLayersRemoved = false;
    this.drawableLayers = drawables;
    this.laymanEndpoint = this.hsCommonLaymanService.layman;
    if (this.laymanEndpoint) {
      await lastValueFrom(
        this.hsLaymanBrowserService.queryCatalog(this.laymanEndpoint, {
          onlyMine: this.onlyMine,
          limit: '',
          query: {},
        }),
      );
      if (this.laymanEndpoint.layers) {
        this.drawableLaymanLayers = this.laymanEndpoint.layers.filter(
          (layer) => {
            return (
              !this.hsMapService.findLayerByTitle(layer.title) && layer.editable
            );
          },
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
              getTitle(layer) == getTitle(this.selectedLayer),
          )) ||
        !this.selectedLayer
      );
    }
  }

  keyUp(event) {
    if (event.key == 'Backspace') {
      this.removeLastPoint();
    }
  }

  /**
   * Determines whether right-click should finish the drawing or not
   * @param typeNum - Number used in calculation of minimal number of vertexes. Depends on geom type (polygon/line)
   * @param vertexCount - Number of vertexes the sketch has
   * @returns return boolean value if right mouse button was clicked
   */
  rightClickCondition(typeNum: number, vertexCount: number): boolean {
    const minPoints = this.hsConfig.preserveLastSketchPoint ? 1 : 0;
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
  async activateDrawing({
    onDrawStart,
    onDrawEnd = (e) => this.onDrawEnd(e),
    onSelected,
    onDeselected,
    drawState = true,
  }: ActivateParams): Promise<void> {
    this.onDeselected = onDeselected;
    this.onSelected = onSelected;
    await this.deactivateDrawing();
    this.hsQueryBaseService.deactivateQueries();
    const drawInteraction = new Draw({
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
            return this.rightClickCondition(4, vertexCount);
          } else if (this.type == 'LineString') {
            const vertexCount = (this.draw as any).sketchCoords_?.length;
            return this.rightClickCondition(2, vertexCount - 1);
          }
        }
      },
    });

    this.setInteraction(drawInteraction);
    this.draw.setActive(drawState);
    this.addHandler(
      drawInteraction.on('drawstart', (e: DrawEvent) => {
        this.checkForMatchingSymbolizer();
        if (onDrawStart) {
          onDrawStart(e);
        }
      }),
    );

    this.addHandler(
      drawInteraction.on('drawend', (e: DrawEvent) => {
        if (this.type == 'Circle') {
          e.feature.setGeometry(fromCircle(e.feature.getGeometry() as Circle));
        }
        if (onDrawEnd) {
          onDrawEnd(e);
        }
      }),
    );

    //Add snap interaction -  must be added after the Modify and Draw interactions
    const snapSourceToBeUsed = this.snapSource ? this.snapSource : this.source;
    this.toggleSnapping(snapSourceToBeUsed);
  }

  /**
   * Register event handlers on draw interactions, so they can be unsubscribed after
   */
  addHandler(e: EventsKey) {
    this.eventHandlers.push(e);
  }

  /**
   * Add draw interaction on map and set some enhancements on it which don't depend on activateDrawing function
   */
  async setInteraction(interaction: Draw): Promise<void> {
    this.draw = interaction;
    const map = await this.hsMapService.loaded();
    map.addInteraction(interaction);

    this.addHandler(
      interaction.on('drawstart', (e: DrawEvent) => {
        if (this.hsUtilsService.runningInBrowser()) {
          document.addEventListener('keyup', this.keyUp.bind(this, e));
        }
      }),
    );

    this.addHandler(
      interaction.on('drawstart', () => {
        this.drawActive = true;
        this.modify.setActive(false);
      }),
    );

    this.addHandler(
      interaction.on('drawend', (e: DrawEvent) => {
        if (this.hsUtilsService.runningInBrowser()) {
          document.removeEventListener('keyup', this.keyUp.bind(this, e));
        }
      }),
    );
  }

  /**
   * Syntactic sugar for translating
   */
  private translate(key: string, params?: any): string {
    return this.hsLanguageService.getTranslation(key, params);
  }

  /**
   * Display warning if symbolizer for current geometry being drawn is not present on layer
   */
  private checkForMatchingSymbolizer() {
    if (!this.hasRequiredSymbolizer()) {
      const stylingMissingHeader = this.translate('DRAW.stylingMissing');
      const txtPanelTitle = this.translate('PANEL_HEADER.LM');
      const stylingMissingWarning = this.translate(
        'DRAW.stylingMissingWarning',
        {
          type: this.type,
          symbolizer: this.requiredSymbolizer[this.type].join(' or '),
          panel: txtPanelTitle,
        },
      );
      this.hsToastService.createToastPopupMessage(
        stylingMissingHeader,
        `${stylingMissingWarning}`,
        {
          serviceCalledFrom: 'HsDrawService',
        },
      );
    }
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
  toggleSnapping(source?: VectorSource): void {
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
  changeSnapSource(layer: VectorLayer<VectorSource>): void {
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
    this.hsQueryBaseService.clear('features');
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
          this.hsQueryBaseService.clear('features');

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
          this.translate('DRAW.boxSelectionActivated'),
          `${this.translate('DRAW.useModifierToSelectWithBox', {
            platformModifierKey: 'CTRL/META',
          })}`,
          {
            toastStyleClasses: 'bg-info text-white',
            serviceCalledFrom: 'HsDrawService',
          },
        );
      }
    });
  }
}
