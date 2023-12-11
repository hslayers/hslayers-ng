import {Component, Input} from '@angular/core';

import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsClusterWidgetComponent} from '../widgets/cluster-widget.component';
import {HsConfirmDialogComponent} from './../../../common/confirm/confirm-dialog.component';
import {HsCopyLayerDialogComponent} from '../dialogs/copy-layer-dialog.component';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsDimensionTimeService} from '../../../common/get-capabilities/dimension-time.service';
import {HsDrawService} from '../../draw/draw.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsExtentWidgetComponent} from '../widgets/extent-widget/extent-widget.component';
import {HsIdwWidgetComponent} from '../widgets/idw-widget.component';
import {HsLanguageService} from './../../language/language.service';
import {HsLayerDescriptor} from './../layer-descriptor.interface';
import {HsLayerEditorDimensionsComponent} from '../dimensions/layer-editor-dimensions.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';
import {HsLayerEditorWidgetContainerService} from '../widgets/layer-editor-widget-container.service';
import {HsLayerManagerRemoveLayerDialogComponent} from '../dialogs/remove-layer-dialog.component';
import {HsLayerManagerService} from '../layer-manager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLegendWidgetComponent} from '../widgets/legend-widget.component';
import {HsMapService} from '../../map/map.service';
import {HsMetadataWidgetComponent} from '../widgets/metadata-widget.component';
import {HsOpacityWidgetComponent} from '../widgets/opacity-widget.component';
import {HsScaleWidgetComponent} from '../widgets/scale-widget.component';
import {HsStylerService} from '../../styler/styler.service';
import {HsTypeWidgetComponent} from '../widgets/type-widget.component';
import {HsWmsSourceWidgetComponent } from '../widgets/wms-source-widget/wms-source-widget.component';
import {
  getBase,
  getCachedCapabilities,
  getGreyscale,
  getRemovable,
  getTitle,
  setTitle,
} from '../../../common/layer-extensions';

@Component({
  selector: 'hs-layer-editor',
  templateUrl: './layer-editor.component.html',
})
export class HsLayerEditorComponent {
  _currentLayer: HsLayerDescriptor;
  @Input('current-layer') set currentLayer(value: HsLayerDescriptor) {
    this._currentLayer = value;
    this.tmpTitle = undefined;
    this.layer_renamer_visible = false;
  }

  get currentLayer(): HsLayerDescriptor {
    return this._currentLayer;
  }

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
    public HsLanguageService: HsLanguageService,
    public hsWidgetContainerService: HsLayerEditorWidgetContainerService,
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
      HsOpacityWidgetComponent,
      HsIdwWidgetComponent,
      HsWmsSourceWidgetComponent ,
    ];
    for (const widgetClass of widgets) {
      this.hsWidgetContainerService.create(widgetClass, {});
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
        message:
          this.HsLanguageService.getTranslation(
            'LAYERMANAGER.layerEditor.savegeojson',
            undefined,
          ) + '?',
        title: this.HsLanguageService.getTranslation(
          'COMMON.confirm',
          undefined,
        ),
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      return this.HsLayerManagerService.saveGeoJson();
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
        message:
          this.HsLanguageService.getTranslation(
            'LAYERMANAGER.layerEditor.copyLayer',
            undefined,
          ) + '?',
        title: this.HsLanguageService.getTranslation(
          'COMMON.copyLayer',
          undefined,
        ),
        layerTitle: getTitle(this.currentLayer.layer),
      },
    );
    const result = await dialog.waitResult();
    if (result.confirmed == 'yes') {
      return this.HsLayerManagerService.copyLayer(result.layerTitle);
    }
  }
}
