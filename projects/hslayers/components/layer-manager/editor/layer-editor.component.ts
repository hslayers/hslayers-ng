import {Component, Input} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsClusterWidgetComponent} from '../widgets/cluster-widget.component';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsCopyLayerDialogComponent} from '../dialogs/copy-layer-dialog.component';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDimensionTimeService} from 'hslayers-ng/services/get-capabilities';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsExtentWidgetComponent} from '../widgets/extent-widget/extent-widget.component';
import {HsIdwWidgetComponent} from '../widgets/idw-widget.component';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorDimensionsComponent} from '../dimensions/layer-editor-dimensions.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';
import {HsLayerEditorWidgetContainerService} from '../widgets/layer-editor-widget-container.service';
import {
  HsLayerManagerCopyLayerService,
  HsLayerManagerService,
} from 'hslayers-ng/services/layer-manager';
import {HsLayerManagerRemoveLayerDialogComponent} from '../dialogs/remove-layer-dialog.component';
import {HsLayerManagerUtilsService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService, HsUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLegendWidgetComponent} from '../widgets/legend-widget.component';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsMetadataWidgetComponent} from '../widgets/metadata-widget.component';
import {HsOpacityWidgetComponent} from '../widgets/opacity-widget.component';
import {HsScaleWidgetComponent} from '../widgets/scale-widget.component';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsTypeWidgetComponent} from '../widgets/type-widget.component';
import {HsWmsSourceWidgetComponent} from '../widgets/wms-source-widget/wms-source-widget.component';
import {LayerFolderWidgetComponent} from '../widgets/layer-folder-widget/layer-folder-widget.component';
import {
  getBase,
  getCachedCapabilities,
  getGreyscale,
  getRemovable,
  getTitle,
  setTitle,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-editor',
  templateUrl: './layer-editor.component.html',
})
export class HsLayerEditorComponent {
  _currentLayer: HsLayerDescriptor;
  @Input({required: true}) set currentLayer(value: HsLayerDescriptor) {
    this._currentLayer = value;
    this.tmpTitle = undefined;
    this.layer_renamer_visible = false;

    if (value) {
      this.insertEditorElement();
    }
  }

  get currentLayer(): HsLayerDescriptor {
    return this._currentLayer;
  }

  layerNodeAvailable: boolean;
  layer_renamer_visible = false;
  getBase = getBase;
  getGreyscale = getGreyscale;
  tmpTitle: string = undefined;
  constructor(
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsDimensionTimeService: HsDimensionTimeService,
    public HsStylerService: HsStylerService,
    public HsMapService: HsMapService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayoutService: HsLayoutService,
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public HsLayerEditorService: HsLayerEditorService,
    public HsDrawService: HsDrawService,
    public HsEventBusService: HsEventBusService,
    public HsDialogContainerService: HsDialogContainerService,
    public hsWidgetContainerService: HsLayerEditorWidgetContainerService,
    private hsLayerManagerUtilsService: HsLayerManagerUtilsService,
    private hsLayerManagerCopyLayerService: HsLayerManagerCopyLayerService,
    private hsUtilsService: HsUtilsService,
  ) {}

  createWidgets() {
    const widgets = [
      HsTypeWidgetComponent,
      HsMetadataWidgetComponent,
      HsExtentWidgetComponent,
      HsClusterWidgetComponent,
      HsScaleWidgetComponent,
      HsLegendWidgetComponent,
      HsLayerEditorDimensionsComponent,
      LayerFolderWidgetComponent,
      HsOpacityWidgetComponent,
      HsIdwWidgetComponent,
      HsWmsSourceWidgetComponent,
    ];
    for (const widgetClass of widgets) {
      this.hsWidgetContainerService.create(widgetClass, {});
    }
  }

  private async awaitLayerNode(idString: string): Promise<boolean> {
    let attempts = 0;
    const maxAttempts = 10;

    while (!document.getElementById(idString) && attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
    this.layerNodeAvailable = true;
    return true;
  }

  /**
   * Insert layer-editor element under the correct layer node
   */
  async insertEditorElement() {
    const l = this.currentLayer;
    const idString = this._currentLayer.idString();
    await this.awaitLayerNode(idString);
    const layerNode = document.getElementById(idString);
    if (layerNode && this.HsLayerManagerService.layerEditorElement) {
      this.hsUtilsService.insertAfter(
        this.HsLayerManagerService.layerEditorElement,
        layerNode,
      );
    }
  }

  /**
   * Confirm saving a vector layer content as a GeoJSON
   * @returns an empty promise
   */
  async createSaveDialog(): Promise<void> {
    const dialog = this.HsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: 'LAYERMANAGER.layerEditor.savegeojson',
        title: 'COMMON.confirm',
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      return this.hsLayerManagerUtilsService.saveGeoJson();
    }
  }

  layerIsWmsT(): boolean {
    return this.HsDimensionTimeService.layerIsWmsT(this.currentLayer);
  }

  /**
   * Zoom to selected layer (layer extent). Get extent
   * from bounding box property, getExtent() function or from
   * BoundingBox property of GetCapabilities request (for WMS layer)
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
    this.HsStylerService.layer = layer as VectorLayer<VectorSource>;
    this.HsLayoutService.setMainPanel('styler');
  }

  /**
   * Toggle layer rename control on panel (through layer rename variable)
   */
  toggleLayerRename(): void {
    this.tmpTitle = undefined;
    this.layer_renamer_visible = !this.layer_renamer_visible;
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
   * stylable. Used for allowing styling
   */
  layerIsStyleable(): boolean {
    return this.HsLayerUtilsService.layerIsStyleable(this.olLayer());
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
    this.HsDialogContainerService.create(
      HsLayerManagerRemoveLayerDialogComponent,
      {olLayer: this.olLayer()},
    );
  }

  olLayer(): Layer<Source> {
    if (!this.currentLayer) {
      return undefined;
    }
    return this.currentLayer.layer;
  }

  /**
   * Change title of layer (Angular automatically change title in object wrapper but it is needed to manually change in Ol.layer object)
   * @param newTitle - New title to set
   */
  set title(newTitle: string) {
    this.tmpTitle = newTitle.trim();
  }

  get title(): string {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    if (this.tmpTitle == undefined) {
      this.tmpTitle = getTitle(layer);
    }
    return this.tmpTitle;
  }

  saveTitle(): void {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    this.HsLayerEditorService.layerTitleChange.next({
      newTitle: this.tmpTitle,
      oldTitle: getTitle(layer),
      layer,
    });
    setTitle(layer, this.tmpTitle);
    this.HsEventBusService.layerManagerUpdates.next(null);
    this.toggleLayerRename();
  }

  titleUnsaved(): boolean {
    return this.tmpTitle != getTitle(this.olLayer());
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

  async copyLayer(): Promise<void> {
    const dialog = this.HsDialogContainerService.create(
      HsCopyLayerDialogComponent,
      {
        message: 'LAYERMANAGER.layerEditor.copyLayer',
        title: 'COMMON.copyLayer',
        layerTitle: getTitle(this.currentLayer.layer),
      },
    );
    const result = await dialog.waitResult();
    if (result.confirmed == 'yes') {
      return this.hsLayerManagerCopyLayerService.copyLayer(result.layerTitle);
    }
  }
}
