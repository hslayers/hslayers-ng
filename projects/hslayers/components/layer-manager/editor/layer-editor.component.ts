import {Component, computed, inject, input, model, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {map} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {TranslatePipe} from '@ngx-translate/core';

import {Feature} from 'ol';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {
  HsLayerManagerCopyLayerService,
  HsLayerManagerService,
  HsLayerManagerUtilsService,
} from 'hslayers-ng/services/layer-manager';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {
  getBase,
  getGreyscale,
  getRemovable,
  getTitle,
  getWfsUrl,
  getWorkspace,
  setTitle,
} from 'hslayers-ng/common/extensions';

// Widgets
import {HsCopyLayerDialogComponent} from '../dialogs/copy-layer-dialog.component';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorWidgetContainerService} from '../widgets/layer-editor-widget-container.service';
import {HsLayerManagerRemoveLayerDialogComponent} from '../dialogs/remove-layer-dialog.component';
import {LAYER_EDITOR_WIDGETS} from './widget-config';
import {layerIsZoomable, layerIsStyleable} from 'hslayers-ng/services/utils';

@Component({
  selector: 'hs-layer-editor',
  templateUrl: './layer-editor.component.html',
  imports: [NgClass, FormsModule, TranslatePipe, HsPanelHelpersModule],
})
export class HsLayerEditorComponent {
  layer = input.required<HsLayerDescriptor>();
  olLayer = computed(() => this.layer()?.layer || undefined);

  HsLayerManagerService = inject(HsLayerManagerService);
  hsWidgetContainerService = inject(HsLayerEditorWidgetContainerService);

  layerNodeAvailable = signal(false);
  layer_renamer_visible = signal(false);

  layerTitle = model<string | undefined>(undefined);

  getBase = getBase;
  getGreyscale = getGreyscale;

  layerIsZoomable = computed(() => layerIsZoomable(this.olLayer()));
  layerIsStyleable = computed(() => layerIsStyleable(this.olLayer()));
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
    private HsStylerService: HsStylerService,
    private HsLayoutService: HsLayoutService,
    private HsLayerEditorService: HsLayerEditorService,
    private HsEventBusService: HsEventBusService,
    private HsDialogContainerService: HsDialogContainerService,
    private hsLayerManagerUtilsService: HsLayerManagerUtilsService,
    private hsLayerManagerCopyLayerService: HsLayerManagerCopyLayerService,
  ) {
    toObservable(this.layer)
      .pipe(
        map((layer) => {
          this.layerTitle.set(layer.title);
          this.layer_renamer_visible.set(false);
        }),
      )
      .subscribe();
  }

  async createWidgets(): Promise<void> {
    if (!this.hsConfig.layerEditorWidgetsEnabled) {
      return;
    }
    const widgetSettings = this.hsConfig.layerEditorWidgets ?? {};

    for (const widget of LAYER_EDITOR_WIDGETS) {
      // Widget is enabled unless explicitly disabled in config
      const isEnabled = widgetSettings[widget.name] ?? true;

      if (isEnabled) {
        try {
          this.hsWidgetContainerService.create(widget.component, {});
        } catch (e) {
          console.warn(`Failed to load widget ${widget.name}:`, e);
        }
      }
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
    this.HsStylerService.layer.set(layer as VectorLayer<VectorSource<Feature>>);
    this.HsLayoutService.setMainPanel('styler');
  }

  /**
   * Toggle layer rename control on panel (through layer rename variable)
   */
  toggleLayerRename() {
    this.layerTitle.set(this.layer().title);
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

  async copyLayer(): Promise<void> {
    const dialog = this.HsDialogContainerService.create(
      HsCopyLayerDialogComponent,
      {
        message: 'LAYERMANAGER.layerEditor.copyLayer',
        title: 'COMMON.copyLayer',
        layerTitle: getTitle(this.layer().layer),
      },
    );
    const result = await dialog.waitResult();
    if (result.confirmed == 'yes') {
      return this.hsLayerManagerCopyLayerService.copyLayer(result.layerTitle);
    }
  }

  /**
   * Open the WFS filter panel
   * layer will be automatically selected via hsLayerSelectorService
   */
  openWfsFilter() {
    this.HsLayoutService.setMainPanel('wfsFilter');
  }
}
