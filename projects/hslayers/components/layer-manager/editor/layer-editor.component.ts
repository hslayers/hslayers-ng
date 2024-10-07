import {
  Component,
  OnDestroy,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {FormsModule} from '@angular/forms';
import {HsClusterWidgetComponent} from '../widgets/cluster-widget.component';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsCopyLayerDialogComponent} from '../dialogs/copy-layer-dialog.component';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsExtentWidgetComponent} from '../widgets/extent-widget/extent-widget.component';
import {HsIdwWidgetComponent} from '../widgets/idw-widget.component';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerEditorDimensionsComponent} from '../dimensions/layer-editor-dimensions.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSubLayerCheckboxesComponent} from './layer-editor-sub-layer-checkboxes.component';
import {HsLayerEditorSublayerService} from './layer-editor-sub-layer.service';
import {HsLayerEditorWidgetContainerService} from '../widgets/layer-editor-widget-container.service';
import {HsLayerFolderWidgetComponent} from '../widgets/layer-folder-widget/layer-folder-widget.component';
import {
  HsLayerManagerCopyLayerService,
  HsLayerManagerService,
} from 'hslayers-ng/services/layer-manager';
import {HsLayerManagerRemoveLayerDialogComponent} from '../dialogs/remove-layer-dialog.component';
import {HsLayerManagerUtilsService} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService, HsUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLegendWidgetComponent} from '../widgets/legend-widget.component';
import {HsMetadataWidgetComponent} from '../widgets/metadata-widget.component';
import {HsOpacityWidgetComponent} from '../widgets/opacity-widget.component';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsScaleWidgetComponent} from '../widgets/scale-widget.component';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsTypeWidgetComponent} from '../widgets/type-widget.component';
import {HsWmsSourceWidgetComponent} from '../widgets/wms-source-widget/wms-source-widget.component';
import {LayerTypeSwitcherWidgetComponent} from '../widgets/layer-type-switcher-widget/layer-type-switcher-widget.component';
import {NgClass} from '@angular/common';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {
  getBase,
  getGreyscale,
  getRemovable,
  getTitle,
  getWfsUrl,
  getWorkspace,
  setTitle,
} from 'hslayers-ng/common/extensions';
import {map} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';

@Component({
  selector: 'hs-layer-editor',
  templateUrl: './layer-editor.component.html',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    TranslateCustomPipe,
    HsLayerEditorSubLayerCheckboxesComponent,
    HsPanelHelpersModule,
  ],
})
export class HsLayerEditorComponent {
  currentLayer = input.required<HsLayerDescriptor>();
  olLayer = computed(() => this.currentLayer()?.layer || undefined);

  HsLayerManagerService = inject(HsLayerManagerService);
  hsWidgetContainerService = inject(HsLayerEditorWidgetContainerService);

  layerNodeAvailable = signal(false);
  layer_renamer_visible = signal(false);

  layerTitle = model<string | undefined>(undefined);

  getBase = getBase;
  getGreyscale = getGreyscale;

  layerIsZoomable = computed(() =>
    this.HsLayerUtilsService.layerIsZoomable(this.olLayer()),
  );
  layerIsStyleable = computed(() =>
    this.HsLayerUtilsService.layerIsStyleable(this.olLayer()),
  );
  isLayerRemovable = computed(() => {
    const layer = this.olLayer();
    return (
      !layer || getRemovable(layer) == undefined || getRemovable(layer) == true
    );
  });
  isVectorLayer = computed(() =>
    this.HsLayerEditorService.isLayerVectorLayer(this.olLayer()),
  );
  wfsFilterEnabled = computed(() => {
    return (
      this.isVectorLayer() &&
      this.hsConfig.panelsEnabled.wfsFilter &&
      (getWfsUrl(this.olLayer()) || getWorkspace(this.olLayer()))
    );
  });

  titleUnsaved = computed(() => this.layerTitle() != getTitle(this.olLayer()));

  constructor(
    private hsConfig: HsConfig,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsStylerService: HsStylerService,
    private HsLayoutService: HsLayoutService,
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    private HsLayerEditorService: HsLayerEditorService,
    private HsEventBusService: HsEventBusService,
    private HsDialogContainerService: HsDialogContainerService,
    private hsLayerManagerUtilsService: HsLayerManagerUtilsService,
    private hsLayerManagerCopyLayerService: HsLayerManagerCopyLayerService,
    private hsUtilsService: HsUtilsService,
  ) {
    toObservable(this.currentLayer)
      .pipe(
        map((layer) => {
          this.layerTitle.set(layer.title);
          this.layer_renamer_visible.set(false);
        }),
      )
      .subscribe();
  }

  createWidgets() {
    const widgets = [
      HsTypeWidgetComponent,
      HsMetadataWidgetComponent,
      HsExtentWidgetComponent,
      HsClusterWidgetComponent,
      HsScaleWidgetComponent,
      HsLegendWidgetComponent,
      HsLayerEditorDimensionsComponent,
      HsLayerFolderWidgetComponent,
      HsOpacityWidgetComponent,
      HsIdwWidgetComponent,
      HsWmsSourceWidgetComponent,
      LayerTypeSwitcherWidgetComponent,
    ];
    for (const widgetClass of widgets) {
      this.hsWidgetContainerService.create(widgetClass, {});
    }
  }

  /**
   * Confirm saving a vector layer content as a GeoJSON
   * @returns an empty promise
   */
  async createSaveDialog() {
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
  styleLayer() {
    const layer = this.olLayer();
    this.HsStylerService.layer = layer as VectorLayer<VectorSource<Feature>>;
    this.HsLayoutService.setMainPanel('styler');
  }

  /**
   * Toggle layer rename control on panel (through layer rename variable)
   */
  toggleLayerRename() {
    this.layerTitle.set(this.currentLayer().title);
    this.layer_renamer_visible.update((visible) => !visible);
  }

  removeLayer(): void {
    this.HsDialogContainerService.create(
      HsLayerManagerRemoveLayerDialogComponent,
      {olLayer: this.olLayer()},
    );
  }

  /**
   * Save the layer title
   */
  saveTitle(): void {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    this.HsLayerEditorService.layerTitleChange.next({
      newTitle: this.layerTitle(),
      oldTitle: getTitle(layer),
      layer,
    });
    setTitle(layer, this.layerTitle());
    this.HsEventBusService.layerManagerUpdates.next(null);
    this.toggleLayerRename();
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
        layerTitle: getTitle(this.currentLayer().layer),
      },
    );
    const result = await dialog.waitResult();
    if (result.confirmed == 'yes') {
      return this.hsLayerManagerCopyLayerService.copyLayer(result.layerTitle);
    }
  }

  /**
   * Open the WFS filter panel
   * currentLayer will be automatically selected via hsLayerSelectorService
   */
  openWfsFilter() {
    this.HsLayoutService.setMainPanel('wfsFilter');
  }
}
