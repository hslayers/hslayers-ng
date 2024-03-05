/* eslint-disable @typescript-eslint/no-unused-vars */
import {Component, Input, OnInit} from '@angular/core';

import {HsAddDataCatalogueService} from 'hslayers-ng/shared/add-data';
import {
  HsAddDataLayerDescriptor,
  HsEndpoint,
  WhatToAddDescriptor,
} from 'hslayers-ng/types';
import {HsCatalogueMetadataComponent} from '../catalogue-metadata/catalogue-metadata.component';
import {HsCatalogueMetadataService} from '../catalogue-metadata/catalogue-metadata.service';
import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLaymanBrowserService} from 'hslayers-ng/shared/add-data';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsSetPermissionsDialogComponent} from 'hslayers-ng/common/dialog-set-permissions';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

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
})
export class HsCatalogueListItemComponent implements OnInit {
  @Input() layer: HsAddDataLayerDescriptor;
  explanationsVisible: boolean;
  metadata;
  selectTypeToAddLayerVisible: boolean;
  whatToAdd: WhatToAddDescriptor;
  whatToAddTypes: string[];
  loadingInfo = false;

  loadingMetadata = false;

  //** Layers wfsWmsStatus is AVAILABLE  */
  layerAvailable: boolean;
  constructor(
    public hsConfig: HsConfig, //used in template
    public hsDatasourcesMetadataService: HsCatalogueMetadataService,
    public hsAddDataCatalogueService: HsAddDataCatalogueService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLaymanBrowserService: HsLaymanBrowserService,
    public hsLogService: HsLogService,
    public hsLanguageService: HsLanguageService,
    public hsLaymanService: HsLaymanService,
    public hsUtilsService: HsUtilsService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
  ) {}

  ngOnInit() {
    this.layerAvailable =
      this.layer.endpoint.type === 'micka' ||
      this.layer.wfsWmsStatus === 'AVAILABLE';
  }

  /**
   * Toggle add layer options
   */
  toggleAddOptions(endpoint: HsEndpoint, layer: HsAddDataLayerDescriptor) {
    if (!this.selectTypeToAddLayerVisible) {
      this.loadingInfo = true;
      this.describeCatalogueLayer(endpoint, layer);
      return;
    }
    this.abortAdd();
  }

  /**
   * Get layer desriptor, show available options or add to map directly if only WFS available
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
      availableTypes.includes('WMS')
        ? availableTypes.splice(1, 0, 'WMTS')
        : availableTypes;
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
  async selectTypeAndAdd(type: string, event: MouseEvent): Promise<void> {
    event.preventDefault();
    if (!this.whatToAdd) {
      this.whatToAdd =
        await this.hsAddDataCatalogueService.describeCatalogueLayer(
          this.layer.endpoint,
          this.layer,
        );
    }
    if (!this.whatToAdd.type || this.whatToAdd.type === 'none') {
      console.error('Could not get catalogue layer descriptor!');
      return;
    }
    this.whatToAdd.type = type === 'WMS' || type === 'WMTS' ? 'WMS' : type;
    this.hsAddDataCatalogueService.addLayerToMap(
      this.layer.endpoint,
      {
        ...this.layer,
        useTiles: type === 'WMTS',
      },
      this.whatToAdd as WhatToAddDescriptor<string>,
    );
  }

  /**
   * Translate string value to the selected UI language
   * @param module - Locales json key
   * @param text - Locales json key value
   * @returns Translated text
   */
  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(
      module,
      text,
      undefined,
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
  async showMetadata(
    endpoint: HsEndpoint,
    layer: HsAddDataLayerDescriptor,
  ): Promise<void> {
    let layerWithMetadata;
    if (endpoint.type.includes('layman')) {
      this.loadingMetadata = true;
      layerWithMetadata = await this.hsLaymanBrowserService.fillLayerMetadata(
        endpoint,
        layer,
      );
    }
    //this.metadata = this.hsDatasourcesMetadataService.decomposeMetadata(layer);
    //console.log(this.metadata);
    this.hsDialogContainerService.create(HsCatalogueMetadataComponent, {
      selectedLayer: layerWithMetadata || layer,
      selectedDS: endpoint,
    });
    this.loadingMetadata = false;
  }

  /**
   * Show permissions dialog window for selected layer.
   * @param layer - Metadata record of selected layer
   */
  async showPermissions(layer: HsAddDataLayerDescriptor): Promise<void> {
    if (!this.layer.endpoint?.authenticated) {
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
  async removeLayer(layer: HsAddDataLayerDescriptor): Promise<void> {
    if (!layer.editable) {
      return;
    }
    const dialog = this.hsDialogContainerService.create(
      HsConfirmDialogComponent,
      {
        message: 'DRAW.reallyDeleteThisLayer',
        note: 'DRAW.deleteNote',
        title: 'COMMON.confirmDelete',
      },
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      const success = await this.hsLaymanService.removeLayer(layer.name);
      if (success) {
        this.hsAddDataCatalogueService.catalogEntries =
          this.hsAddDataCatalogueService.catalogEntries.filter((item) => {
            return item.id != layer.id;
          });
      }
    }
  }
}
