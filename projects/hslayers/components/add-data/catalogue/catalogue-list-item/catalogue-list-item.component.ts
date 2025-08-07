import {Component, computed, input, inject} from '@angular/core';
import {NgClass, NgStyle} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsAddDataCatalogueService,
  HsLaymanBrowserService,
} from 'hslayers-ng/services/add-data';
import {
  HsAddDataLaymanLayerDescriptor,
  HsAddDataLayerDescriptor,
  HsEndpoint,
  WhatToAddDescriptor,
} from 'hslayers-ng/types';
import {HsCatalogueMetadataService} from '../catalogue-metadata/catalogue-metadata.service';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsRemoveLayerDialogService} from 'hslayers-ng/common/remove-multiple';
import {HsSetPermissionsDialogComponent} from 'hslayers-ng/common/dialog-set-permissions';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';

@Component({
  selector: 'hs-catalogue-list-item',
  templateUrl: 'catalogue-list-item.component.html',
  styles: [
    `
      .dropdown-toggle::after {
        font-size: 1.25rem;
        vertical-align: initial;
      }
    `,
  ],
  imports: [NgClass, NgStyle, TranslatePipe],
})
export class HsCatalogueListItemComponent {
  private hsDatasourcesMetadataService = inject(HsCatalogueMetadataService);
  hsAddDataCatalogueService = inject(HsAddDataCatalogueService);
  private hsDialogContainerService = inject(HsDialogContainerService);
  private hsLaymanBrowserService = inject(HsLaymanBrowserService);
  private hsLog = inject(HsLogService);
  private hsRemoveLayerDialogService = inject(HsRemoveLayerDialogService);
  private hsCommonLaymanService = inject(HsCommonLaymanService);

  layer = input<HsAddDataLayerDescriptor>();

  title = computed(() => this.layer().title);
  abstract = computed(() => {
    const layer = this.layer();
    const hasAbstract = layer['abstract'];
    return hasAbstract ? layer['abstract'] : '';
  });

  //** Layers wfsWmsStatus is AVAILABLE  */
  layerAvailable = computed(() => {
    const layer = this.layer();
    return (
      layer.endpoint.type === 'micka' || layer.wfsWmsStatus === 'AVAILABLE'
    );
  });

  explanationsVisible: boolean;
  metadata;
  selectTypeToAddLayerVisible: boolean;
  whatToAdd: WhatToAddDescriptor;
  whatToAddTypes: string[];
  loadingInfo = false;

  loadingMetadata = false;

  /**
   * Toggle add layer options
   */
  toggleAddOptions() {
    if (!this.selectTypeToAddLayerVisible) {
      this.loadingInfo = true;
      this.describeCatalogueLayer(this.layer().endpoint, this.layer());
      return;
    }
    this.abortAdd();
  }

  /**
   * Get layer descriptor, show available options or add to map directly if only WFS available
   */
  private async describeCatalogueLayer(
    endpoint: HsEndpoint,
    layer: HsAddDataLayerDescriptor,
  ) {
    this.whatToAdd =
      await this.hsAddDataCatalogueService.describeCatalogueLayer(
        endpoint,
        layer,
      );
    this.loadingInfo = false;
    let availableTypes = this.whatToAdd.type;

    /**
     * Layer is available only as a WFS or its service
     */
    if (this.whatToAdd.type === 'WFS' || layer.type.includes('service')) {
      this.selectTypeAndAdd(
        this.whatToAdd.type as string,
        new MouseEvent('click'),
      );
    } else if (Array.isArray(availableTypes) || availableTypes == 'WMS') {
      availableTypes =
        availableTypes === 'WMS' ? [availableTypes] : availableTypes;
      /**
       * Add another type allowing user to choose image source type
       */
      if (availableTypes.includes('WMS')) {
        availableTypes.splice(1, 0, 'WMTS');
      }
      this.whatToAddTypes = availableTypes;
    }

    this.selectTypeToAddLayerVisible = Array.isArray(availableTypes);
    this.explanationsVisible = false;
  }

  abortAdd(): void {
    this.selectTypeToAddLayerVisible = Array.isArray(this.whatToAddTypes);
    this.explanationsVisible = false;
  }

  /**
   * Add layer by type click wrapper. Prevents bubbling of DOM event
   * @param type - One of 'WMS', 'WFS'
   * @param event - Mouse click event
   */
  async selectTypeAndAdd(type: string, event: MouseEvent) {
    event.preventDefault();
    const layer = this.layer();
    if (!this.whatToAdd) {
      this.whatToAdd =
        await this.hsAddDataCatalogueService.describeCatalogueLayer(
          layer.endpoint,
          layer,
        );
    }
    if (!this.whatToAdd.type || this.whatToAdd.type === 'none') {
      this.hsLog.error('Could not get catalogue layer descriptor!');
      return;
    }
    this.whatToAdd.type = type === 'WMS' || type === 'WMTS' ? 'WMS' : type;
    this.hsAddDataCatalogueService.addLayerToMap(
      layer.endpoint,
      this.whatToAdd as WhatToAddDescriptor<string>,
      {
        useTiles: type === 'WMTS',
      },
    );
  }

  toggleExplanations(): void {
    this.explanationsVisible = !this.explanationsVisible;
  }

  /**
   * Show metadata record dialog window for selected layer.
   * @param endpoint - Datasource of selected layer
   * @param layer - Metadata record of selected layer
   */
  async showMetadata(): Promise<void> {
    const layer = this.layer();
    const endpoint = layer.endpoint;
    let layerWithMetadata;
    if (endpoint.type.includes('layman')) {
      this.loadingMetadata = true;
      layerWithMetadata = await this.hsLaymanBrowserService.fillLayerMetadata(
        endpoint,
        layer as HsAddDataLaymanLayerDescriptor,
      );
    }
    //this.metadata = this.hsDatasourcesMetadataService.decomposeMetadata(layer);
    //console.log(this.metadata);
    const {HsCatalogueMetadataComponent} = await import(
      '../catalogue-metadata/catalogue-metadata.component'
    );
    this.hsDialogContainerService.create(HsCatalogueMetadataComponent, {
      data: {
        selectedLayer: layerWithMetadata || layer,
        selectedDS: endpoint,
      },
      signalInput: true,
    });
    this.loadingMetadata = false;
  }

  /**
   * Show permissions dialog window for selected layer.
   * @param layer - Metadata record of selected layer
   */
  async showPermissions(): Promise<void> {
    const layer = this.layer();
    if (!this.hsCommonLaymanService.isAuthenticated()) {
      return;
    }
    this.hsDialogContainerService.create(HsSetPermissionsDialogComponent, {
      recordType: 'layer',
      selectedRecord: layer,
      onPermissionSaved: {
        service: this.hsAddDataCatalogueService,
        method: 'reloadData',
      },
    });
  }

  /**
   * @param endpoint - Datasource of selected layer
   * @param layer - Metadata record of selected layer
   * @returns URL to record file
   */

  layerRDF(endpoint: HsEndpoint, layer): string {
    return this.hsAddDataCatalogueService.layerRDF(endpoint, layer);
  }

  /**
   * Removes selected drawing layer from both Layermanager and Layman
   * @param layer - Metadata record of selected layer
   */
  async removeLayer(): Promise<void> {
    const layer = this.layer();
    if (!layer.editable) {
      return;
    }

    const confirmed = await this.hsRemoveLayerDialogService.removeLayer(
      layer.name,
      ['catalogue'],
    );
    if (confirmed) {
      this.hsAddDataCatalogueService.catalogEntries =
        this.hsAddDataCatalogueService.catalogEntries.filter((item) => {
          return item.id != layer.id;
        });
    }
  }
}
