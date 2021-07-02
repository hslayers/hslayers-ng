import {Component, Input} from '@angular/core';
import {HsConfirmDialogComponent} from './../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsDrawService} from '../draw/draw.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsStylerService} from '../styles/styler.service';
import {Layer} from 'ol/layer';
import {
  getAbstract,
  getAttribution,
  getBase,
  getCachedCapabilities,
  getRemovable,
  getTitle,
  setAbstract,
  setTitle,
} from '../../common/layer-extensions';

@Component({
  selector: 'hs-layer-editor',
  templateUrl: './partials/layer-editor.html',
})
export class HsLayerEditorComponent {
  @Input('current-layer') currentLayer: HsLayerDescriptor;
  distance = {
    value: 40,
  };
  layer_renamer_visible = false;
  getAttribution = getAttribution;
  getBase = getBase;
  constructor(
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsLayerManagerWmstService: HsLayerManagerWmstService,
    public HsStylerService: HsStylerService,
    public HsMapService: HsMapService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayoutService: HsLayoutService,
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public HsLayerEditorService: HsLayerEditorService,
    public HsDrawService: HsDrawService,
    public HsEventBusService: HsEventBusService,
    public HsLayerManagerMetadataService: HsLayerManagerMetadataService, // Used in template
    public HsDialogContainerService: HsDialogContainerService,
    public HsLanguageService: HsLanguageService
  ) {}

  /**
   * Confirm saving a vector layer content as a geoJSON
   * @returns an empty promise
   */
  async createSaveDialog(): Promise<void> {
    const dialog = this.HsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message:
          this.HsLanguageService.getTranslation(
            'LAYERMANAGER.layerEditor.savegeojson'
          ) + '?',
        title: this.HsLanguageService.getTranslation('COMMON.confirm'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      return this.HsLayerManagerService.saveGeoJson();
    }
  }

  layerIsWmsT(): boolean {
    return this.HsLayerManagerWmstService.layerIsWmsT(this.currentLayer);
  }

  /**
   * Zoom to selected layer (layer extent). Get extent
   * from bounding box property, getExtent() function or from
   * BoundingBox property of GetCapabalities request (for WMS layer)
   * @returns a promise
   */
  zoomToLayer(): Promise<any> {
    return this.HsLayerEditorService.zoomToLayer(this.olLayer());
  }

  /**
   * Display styler panel for selected layer, so user can change its style
   */
  styleLayer(): void {
    const layer = this.olLayer();
    this.HsStylerService.layer = layer;
    this.HsLayoutService.setMainPanel('styler');
  }

  /**
   * Test if layer is WMS layer
   * @param layer - Selected layer
   */
  isLayerVectorLayer(layer: Layer): boolean {
    return this.HsLayerUtilsService.isLayerVectorLayer(layer);
  }

  /**
   * Test if layer is WMS layer
   */
  isVectorLayer(): boolean | undefined {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    if (!this.isLayerVectorLayer(layer)) {
      return;
    } else {
      return true;
    }
  }

  /**
   * Set cluster for layer
   * @param newValue - To cluster or not to cluster
   */
  set cluster(newValue: boolean) {
    if (!this.currentLayer) {
      return;
    }
    this.HsLayerEditorService.cluster(
      this.olLayer(),
      newValue,
      this.distance.value
    );
  }

  /**
   * @returns Current cluster state
   */
  get cluster(): boolean | undefined {
    if (!this.currentLayer) {
      return;
    }
    return this.HsLayerEditorService.cluster(
      this.olLayer(),
      undefined,
      this.distance.value
    );
  }

  /**
   * Set distance between cluster features;
   */
  changeDistance(): void {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    if (layer.getSource().setDistance == undefined) {
      return;
    }
    layer.getSource().setDistance(this.distance.value);
  }

  /**
   * Toogle layer rename control on panel (through layer rename variable)
   */
  toggleLayerRename(): void {
    this.layer_renamer_visible = !this.layer_renamer_visible;
  }

  /**
   * Set selected layer's opacity and emits "compositionchanged"
   * @param newValue
   */
  set opacity(newValue) {
    if (!this.currentLayer) {
      return;
    }
    this.olLayer().setOpacity(newValue);
    this.HsEventBusService.compositionEdits.next();
  }

  get opacity() {
    return this.olLayer().getOpacity();
  }

  /**
   * Determines if selected layer has BoundingBox defined as
   * its metadata or is a Vector layer. Used for setting visibility
   * of 'Zoom to ' button
   */
  layerIsZoomable(): boolean {
    return this.HsLayerUtilsService.layerIsZoomable(this.olLayer());
  }

  /**
   * Determines if selected layer is a Vector layer and
   * styleable. Used for allowing styling
   */
  layerIsStyleable(): boolean {
    return this.HsLayerUtilsService.layerIsStyleable(this.olLayer());
  }

  /**
   * Determines if layer has copyright information available
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
    if (!this.currentLayer) {
      return;
    } else {
      return getAttribution(layer.layer)?.onlineResource != undefined;
    }
  }

  /**
   * Set min resolution for selected layer
   * @param newValue
   */
  set minResolution(newValue) {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    layer.setMinResolution(newValue);
  }

  get minResolution() {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    return layer.getMinResolution();
  }

  /**
   * Set max resolution for selected layer
   * @param newValue
   */
  set maxResolution(newValue) {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    layer.setMaxResolution(newValue);
  }

  get maxResolution() {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    return layer.getMaxResolution();
  }

  /**
   * Check if layer can be removed based on 'removable'
   * layer attribute
   */
  isLayerRemovable(): boolean {
    const layer = this.olLayer();
    return (
      !layer || getRemovable(layer) == undefined || getRemovable(layer) == true
    );
  }

  removeLayer(): void {
    if (this.HsDrawService.selectedLayer == this.olLayer()) {
      this.HsDrawService.selectedLayer = null;
    }
    this.HsMapService.map.removeLayer(this.olLayer());
    this.HsDrawService.fillDrawableLayers();

    this.HsEventBusService.layerManagerUpdates.next();
  }

  /**
   * Test if selected layer has min and max relolution set
   */
  isScaleVisible(): boolean {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return this.minResolutionValid() || this.maxResolutionValid();
  }

  olLayer(): Layer {
    if (!this.currentLayer) {
      return undefined;
    }
    return this.currentLayer.layer;
  }

  minResolutionValid(): boolean {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return (
      layer.getMinResolution() != undefined && layer.getMinResolution() != 0
    );
  }

  maxResolutionValid(): boolean {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return (
      layer.getMaxResolution() != undefined &&
      layer.getMaxResolution() != Infinity
    );
  }

  /**
   * Change title of layer (Angular automatically change title in object wrapper but it is needed to manually change in Ol.layer object)
   * @param newTitle - New title to set
   */
  set title(newTitle: string) {
    const newLayerTitle = newTitle.trim();
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    layer.title = newLayerTitle;
    this.HsLayerEditorService.layerTitleChange.next({
      newTitle: newLayerTitle,
      oldTitle: getTitle(layer),
      layer,
    });
    setTitle(layer, newLayerTitle);
    this.HsEventBusService.layerManagerUpdates.next();
  }

  get title(): string {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    return getTitle(layer);
  }

  set abstract(newAbstract: string) {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    setAbstract(layer, newAbstract);
  }

  get abstract(): string {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    return getAbstract(layer);
  }

  hasSubLayers(): boolean | undefined {
    if (this.currentLayer === null) {
      return;
    }
    const subLayers = getCachedCapabilities(this.currentLayer.layer)?.Layer;
    return subLayers != undefined && subLayers.length > 0;
  }

  getSubLayers() {
    return this.HsLayerEditorSublayerService.getSubLayers();
  }
}
