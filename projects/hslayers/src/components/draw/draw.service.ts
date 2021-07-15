import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Draw, Modify, Snap} from 'ol/interaction';
import {HsAddDataVectorService} from '../add-data/vector/add-data-vector.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsConfirmDialogComponent} from './../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata.component';
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
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Subject} from 'rxjs';
import {fromCircle} from 'ol/geom/Polygon';
import {
  getDefinition,
  getEditor,
  getName,
  getTitle,
  setDefinition,
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
  hasSomeDrawables: boolean;
  draw: Draw;
  modify: Modify;

  //Snap interaction
  snap: Snap;
  snapActive = false;
  snapSource: VectorSource;
  snapLayer: Layer;

  /**
   * @type {GeometryType}
   * @memberof HsDrawService
   */
  type: string; //string of type GeometryType
  selectedLayer: Layer;
  tmpDrawLayer: any;
  source: VectorSource;
  drawActive = false;
  selectedFeatures: any = new Collection();
  onSelected: any;
  currentStyle: any;
  highlightDrawButton = false; // Toggles toolbar button 'Draw' class
  defaultStyle = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
  <StyledLayerDescriptor version="1.0.0" xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <NamedLayer>
      <Name/>
      <UserStyle>
        <Name/>
        <Title/>
        <FeatureTypeStyle>
          <Rule>
            <Name/>
            <PointSymbolizer>
              <Graphic>
                <Mark>
                  <WellKnownName>circle</WellKnownName>
                  <Fill>
                    <CssParameter name="fill">rgba(255, 255, 255, 0.41)</CssParameter>
                  </Fill>
                  <Stroke>
                    <CssParameter name="stroke">rgba(0, 153, 255, 1)</CssParameter>
                    <CssParameter name="stroke-width">1.25</CssParameter>
                  </Stroke>
                </Mark>
                <Size>10</Size>
              </Graphic>
            </PointSymbolizer>
            <PolygonSymbolizer>
              <Fill>
                <CssParameter name="fill-opacity">0.45</CssParameter>
              </Fill>
              <Stroke>
                <CssParameter name="stroke">rgba(0, 153, 255, 1)</CssParameter>
                <CssParameter name="stroke-width">1.25</CssParameter>
                <CssParameter name="stroke-opacity">0.3</CssParameter>
              </Stroke>
            </PolygonSymbolizer>
            <LineSymbolizer>
              <Stroke>
                <CssParameter name="stroke">rgba(0, 153, 255, 1)</CssParameter>
                <CssParameter name="stroke-width">1.25</CssParameter>
              </Stroke>
            </LineSymbolizer>
          </Rule>
        </FeatureTypeStyle>
      </UserStyle>
    </NamedLayer>
  </StyledLayerDescriptor>`;
  onDeselected: any;
  public drawingLayerChanges: Subject<{
    layer: BaseLayer;
    source: VectorSource;
  }> = new Subject();
  laymanEndpoint: any;
  previouslySelected: any;
  isAuthorized: boolean;
  onlyMine = true;
  addedLayersRemoved = false;

  //Layer being loaded from layman (endpoint url pending)
  pendingLayers = [];

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
    public HsAddDataVectorService: HsAddDataVectorService,
    public HsUtilsService: HsUtilsService,
    public HsCommonLaymanService: HsCommonLaymanService
  ) {
    this.keyUp = this.keyUp.bind(this);
    this.HsMapService.loaded().then((map) => {
      this.modify = new Modify({
        features: this.selectedFeatures,
      });
      map.addInteraction(this.modify);
    });

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

    this.HsEventBusService.vectorQueryFeatureSelection.subscribe((event) => {
      this.selectedFeatures.push(event.feature);
    });

    this.HsEventBusService.vectorQueryFeatureDeselection.subscribe(
      ({feature, selector}) => {
        this.selectedFeatures.remove(feature);
      }
    );

    this.HsEventBusService.mapResets.subscribe(() => {
      this.addedLayersRemoved = true;
      this.fillDrawableLayers();
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
      //When metadata dialog window opened. Layer is being added
      if (this.selectedLayer && this.tmpDrawLayer) {
        setWorkspace(this.selectedLayer, endpoint.user);
        const defition = {
          format: this.isAuthorized ? 'hs.format.WFS' : null,
          url: this.isAuthorized
            ? this.HsLaymanService.getLaymanEndpoint().url + '/wfs'
            : null,
        };
        setDefinition(this.selectedLayer, defition);
      }
    });

    this.HsEventBusService.LayerManagerLayerVisibilityChanges.subscribe(
      (event) => {
        if (this.draw && event.layer == this.selectedLayer) {
          this.setType(this.type);
        }
      }
    );

    this.HsLaymanService.laymanLayerPending.subscribe((pendingLayers) => {
      this.pendingLayers = pendingLayers;
    });
  }
  /**
   * initial function if the draw panel is loaded as first panel
   */
  init(): void {
    this.HsMapService.loaded().then((_) => {
      this.fillDrawableLayers();
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
        ? this.HsLanguageService.getTranslation('DRAW.unsavedDrawing')
        : this.HsLayerUtilsService.translateTitle(title) ||
            getName(this.selectedLayer);
    } else {
      return this.HsLanguageService.getTranslation('DRAW.Select layer');
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
        this.HsLayerUtilsService.translateTitle(title) ||
        getName(this.snapLayer)
      );
    }
  }

  saveDrawingLayer(): void {
    if (this.selectedLayer) {
      this.previouslySelected = this.selectedLayer;
    }

    let tmpTitle = this.HsLanguageService.getTranslation('DRAW.drawLayer');

    const tmpLayer = this.HsMapService.findLayerByTitle(TMP_LAYER_TITLE);
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
      //TODO: Also name should be set, but take care in case a layer with that name already exists in layman
      source: tmpSource,
      showInLayerManager: true,
      visible: true,
      removable: true,
      sld: this.defaultStyle,
      editable: true,
      path: this.HsConfig.defaultDrawLayerPath || 'User generated', //TODO: Translate this
      definition: {
        format: this.isAuthorized ? 'hs.format.WFS' : null,
        url: this.isAuthorized ? layman.url + '/wfs' : null,
      },
      workspace: layman?.user,
    });
    this.tmpDrawLayer = true;
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
        this.HsMapService.findLayerByTitle(TMP_LAYER_TITLE) || null;
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
        title: TMP_LAYER_TITLE,
        source: new VectorSource(),
        showInLayerManager: false,
        visible: true,
        removable: true,
        editable: true,
        path: this.HsConfig.defaultDrawLayerPath || 'User generated',
      });
      this.tmpDrawLayer = true;
      this.selectedLayer = drawLayer;
      this.addDrawLayer(drawLayer);
    }
    this.type = what;
    if (this.selectedLayer) {
      this.source = this.HsLayerUtilsService.isLayerClustered(
        this.selectedLayer
      )
        ? this.selectedLayer.getSource().getSource() //Is it clustered vector layer?
        : this.selectedLayer.getSource();
    }
    return true;
  }

  /**
   * @param layer
   * @function selectLayer
   * @description Handles drawing layer selection/change by activating drawing for selected layer.
   * In case of layman layer not yet existing in app it pulls the layer first.
   */
  async selectLayer(layer) {
    let lyr = layer;
    if (layer.type) {
      lyr = await this.HsAddDataVectorService.addVectorLayer(
        'wfs',
        this.laymanEndpoint.url,
        layer.name,
        layer.title,
        undefined,
        'EPSG:4326',
        {workspace: layer.workspace}
      );
      lyr = this.HsMapService.findLayerByTitle(layer.title);
    }
    if (lyr != this.selectedLayer) {
      if (
        this.selectedLayer &&
        getTitle(this.selectedLayer) == TMP_LAYER_TITLE
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
    /*Timeout is necessary because features are not imediately
     * added to the layer and layer can't be retrieved from the
     * feature, so they don't appear in Info panel */
    if (
      this.HsLayoutService.mainpanel != 'draw' &&
      this.HsConfig.openQueryPanelOnDrawEnd
    ) {
      this.HsLayoutService.setMainPanel('info');
    }
    setTimeout(() => {
      this.HsQueryBaseService.clearData('features');
      this.HsQueryVectorService.selector.getFeatures().push(e.feature);
      this.HsQueryVectorService.createFeatureAttributeList();
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
   * @function changeDrawSource
   * @description Sets layer source where new drawing should be pushed to... after 'selectedLayer' change
   */
  changeDrawSource(): void {
    if (this.selectedLayer.getSource === undefined) {
      return;
    }
    this.source = this.HsLayerUtilsService.isLayerClustered(this.selectedLayer)
      ? this.selectedLayer.getSource().getSource()
      : this.selectedLayer.getSource();

    this.drawingLayerChanges.next({
      layer: this.selectedLayer,
      source: this.source,
    });
    if (this.draw) {
      //Reactivate drawing with updated source
      this.activateDrawing({
        drawState: true,
        onDrawEnd: (e) => this.onDrawEnd(e),
      });
      //Set snapLayer and snap interaction source
      this.snapLayer = this.selectedLayer;
      this.toggleSnapping(this.source);
    }
  }

  /**
   * @function deactivateDrawing
   * @return {Promise}
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
        resolve(null);
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
   * @description Repopulates drawable layers. In case layman connection exists it also creates
   * a list of avaliable server possiblities.
   */
  async fillDrawableLayers(): Promise<void> {
    const drawables = this.HsMapService.map
      .getLayers()
      .getArray()
      .filter((layer) => this.HsLayerUtilsService.isLayerDrawable(layer));
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
    this.laymanEndpoint = this.HsLaymanService.getLaymanEndpoint();
    if (this.laymanEndpoint) {
      await this.HsLaymanBrowserService.queryCatalog(this.laymanEndpoint, {
        onlyMine: this.onlyMine,
        limit: '',
        query: {},
      }).toPromise();
      if (this.laymanEndpoint.layers) {
        this.drawableLaymanLayers = this.laymanEndpoint.layers.filter(
          (layer) => {
            return (
              !this.HsMapService.findLayerByTitle(layer.title) && layer.editable
            );
          }
        );
      }
    }
    this.hasSomeDrawables =
      this.drawableLayers.length > 0 || this.drawableLaymanLayers.length > 0;
  }

  private selectedLayerNotAvailable(drawables) {
    if (this.addedLayersRemoved) {
      return true;
    } else {
      return (
        //Dont want to change after authChange when layer is being added
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
   * @function removeLayer
   * @description Removes selected drawing layer from both Layermanager and Layman
   */
  async removeLayer(): Promise<void> {
    const note = this.isAuthorized
      ? this.HsLanguageService.getTranslation('DRAW.deleteNote')
      : '';
    const dialog = this.HsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: this.HsLanguageService.getTranslation(
          'DRAW.reallyDeleteThisLayer'
        ),
        note: note,
        title: this.HsLanguageService.getTranslation('COMMON.confirmDelete'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.HsMapService.map.removeLayer(this.selectedLayer);
      const definition = getDefinition(this.selectedLayer);
      if (
        definition?.format?.toLowerCase().includes('wfs') &&
        definition?.url
      ) {
        this.HsLaymanService.removeLayer(this.selectedLayer);
      }
      if (getTitle(this.selectedLayer) == TMP_LAYER_TITLE) {
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
    if (event.key == 'Backspace') {
      this.removeLastPoint();
    }
  }
  /**
   * @function rightClickCondition
   * @description Determines whether rightclick should finish the drawing or not
   * @param typeNum Number used in calculation of minimal number of vertexes. Depends on geom type (polygon/line)
   * @param vertexCount Number of vertexes the sketch has
   * @return return boolean value if right mouse button was clicked
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
    drawState = true,
  }: activateParams): void {
    this.onDeselected = onDeselected;
    this.onSelected = onSelected;
    this.deactivateDrawing().then(() => {
      this.HsQueryBaseService.deactivateQueries();
      this.draw = new Draw({
        source: this.source,
        type: /** @type {GeometryType} */ this.type,
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
          if (this.HsUtilsService.runningInBrowser()) {
            document.addEventListener('keyup', this.keyUp);
          }
        },
        this
      );

      this.draw.on(
        'drawend',
        (e) => {
          if (this.type == 'Circle') {
            e.feature.setGeometry(fromCircle(e.feature.getGeometry()));
          }
          if (onDrawEnd) {
            onDrawEnd(e);
          }
          if (this.HsUtilsService.runningInBrowser()) {
            document.removeEventListener('keyup', this.keyUp);
          }
        },
        this
      );

      //Add snap interaction -  must be added after the Modify and Draw interactions
      const snapSourceToBeUsed = this.snapSource
        ? this.snapSource
        : this.source;
      this.toggleSnapping(snapSourceToBeUsed);
    });
  }

  /**
   * Handle snap interaction changes
   * Remove snap interaction if it already exists, recreate it if source is provided.
   */
  toggleSnapping(source?: VectorSource): void {
    this.HsMapService.loaded().then((map) => {
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
  changeSnapSource(layer: Layer): void {
    //isLayerClustered
    const snapSourceToBeUsed = this.HsLayerUtilsService.isLayerClustered(layer)
      ? layer.getSource().getSource()
      : layer.getSource();
    this.snapLayer = layer;
    this.toggleSnapping(snapSourceToBeUsed);
  }
}
