import {Component, Signal, inject, signal} from '@angular/core';
import {Observable, map} from 'rxjs';

import {
  HsLayerManagerFolderService,
  HsLayerManagerLoadingProgressService,
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';

import {AsyncPipe, NgClass} from '@angular/common';
import {HsBaseLayerDescriptor} from 'hslayers-ng/types';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerEditorWidgetBaseComponent} from '../layer-editor-widget-base.component';
import {HsLayerUtilsService, HsUtilsService} from 'hslayers-ng/services/utils';
import {OSM} from 'ol/source';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {getBase, setBase} from 'hslayers-ng/common/extensions';

type layerType = 'base' | 'thematic';

@Component({
  selector: 'hs-layer-type-switcher-widget',
  standalone: true,
  imports: [NgClass, AsyncPipe, TranslateCustomPipe],
  templateUrl: './layer-type-switcher-widget.component.html',
})
export class LayerTypeSwitcherWidgetComponent extends HsLayerEditorWidgetBaseComponent {
  private hsLayermanagerService = inject(HsLayerManagerService);
  private hsLayerManagerVisibilityService = inject(
    HsLayerManagerVisibilityService,
  );
  private loadingProgressSerice = inject(HsLayerManagerLoadingProgressService);
  private folderService = inject(HsLayerManagerFolderService);

  private hsEventBusService = inject(HsEventBusService);
  private hsLayerUtilsService = inject(HsLayerUtilsService);
  private hsUtilsService = inject(HsUtilsService);
  private hsDialogContainerService = inject(HsDialogContainerService);

  isEnabled: Observable<boolean>;
  currentType: Signal<string>;

  types: layerType[] = ['base', 'thematic'];

  typeChanged$: Observable<void>;

  constructor(hsLayerSelectorService: HsLayerSelectorService) {
    super(hsLayerSelectorService);

    this.isEnabled = this.layerDescriptor.pipe(
      map((layer) => {
        const source = layer.layer.getSource();
        return (
          !!layer.layer &&
          /**
           * Allowed for layers which are not OSM, Vector or IDW
           */
          !this.hsUtilsService.instOf(source, OSM) &&
          !this.hsLayerUtilsService.isLayerIDW(layer.layer) &&
          !this.hsLayerUtilsService.isLayerVectorLayer(layer.layer)
        );
      }),
    );

    this.currentType = signal(
      getBase(this.hsLayerSelectorService.currentLayer.layer)
        ? 'base'
        : 'thematic',
    );
  }

  /***
   * Toggle between base and thematic layer type
   */
  async changeLayerType(type: layerType) {
    if (type == this.currentType()) {
      return;
    }
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: 'LAYERMANAGER.layerEditor.changeLayerType',
        note: 'LAYERMANAGER.layerEditor.layerTypeChangeNote',
        title: 'LAYERMANAGER.layerEditor.confirmLayerTypeChange',
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed === 'yes') {
      setBase(this.olLayer, type === 'base');

      this.updateLayerType(type === 'base');
    }
  }

  private updateLayerType(toBase: boolean) {
    const currentLayer = this.hsLayerSelectorService.currentLayer;

    /**
     * Remove/add manipulated layer from/to the layer folder structure
     */
    this.folderService.folderAction$.next(
      this.folderService[toBase ? 'removeLayer' : 'addLayer'](currentLayer),
    );
    this.folderService.folderAction$.next(this.folderService.sortByZ());

    /**
     * Remove/add manipulated layer to the layermanager layer structure
     */
    const [current, destination] = toBase
      ? [
          this.hsLayermanagerService.data.layers,
          this.hsLayermanagerService.data.baselayers,
        ]
      : [
          this.hsLayermanagerService.data.baselayers,
          this.hsLayermanagerService.data.layers,
        ];

    destination.push(currentLayer as HsBaseLayerDescriptor);
    current.splice(current.indexOf(currentLayer as HsBaseLayerDescriptor), 1);

    /**
     * Update visiblity of base layer
     */
    this.hsLayerManagerVisibilityService.changeBaseLayerVisibility(
      true,
      toBase ? currentLayer : this.hsLayermanagerService.data.baselayers[0],
    );

    if (!toBase) {
      this.loadingProgressSerice.loadingEvents(currentLayer);
    }

    this.hsEventBusService.layerManagerUpdates.next(this.olLayer);
    this.hsEventBusService.compositionEdits.next();
  }
}
