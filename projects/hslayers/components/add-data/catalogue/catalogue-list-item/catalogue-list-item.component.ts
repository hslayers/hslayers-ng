/* eslint-disable @typescript-eslint/no-unused-vars */
import {Component, Input, OnInit} from '@angular/core';

import {HsAddDataCatalogueService} from 'hslayers-ng/shared/add-data';
import {HsAddDataLayerDescriptor} from 'hslayers-ng/types';
import {HsCatalogueMetadataComponent} from '../catalogue-metadata/catalogue-metadata.component';
import {HsCatalogueMetadataService} from '../catalogue-metadata/catalogue-metadata.service';
import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsConfig} from 'hslayers-ng/config';
import {HsConfirmDialogComponent} from 'hslayers-ng/common/confirm';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEndpoint} from 'hslayers-ng/types';
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
  selectedType: string; //do not rename to 'type', would clash in the template
  selectTypeToAddLayerVisible: boolean;
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
      this.addLayerToMap(endpoint, layer);
      return;
    }
    this.abortAdd();
  }

  /**
   * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
   * @param endpoint - Datasource of selected layer
   * @param layer - Metadata record of selected layer
   */
  async addLayerToMap(
    endpoint: HsEndpoint,
    layer: HsAddDataLayerDescriptor,
  ): Promise<void> {
    const availableTypes = await this.hsAddDataCatalogueService.addLayerToMap(
      endpoint,
      layer,
      this.selectedType,
    );
    this.loadingInfo = false;
    if (Array.isArray(availableTypes)) {
      /**
       * Add third type allowing user to choose image source type
       */
      availableTypes.includes('WMS')
        ? availableTypes.splice(1, 0, 'WMTS')
        : availableTypes;
      this.whatToAddTypes = availableTypes;
      this.selectTypeToAddLayerVisible = true;
    } else {
      this.selectTypeToAddLayerVisible = false;
      this.selectedType = null;
    }
    this.explanationsVisible = false;
  }

  abortAdd(): void {
    this.selectTypeToAddLayerVisible = false;
    this.explanationsVisible = false;
    this.selectedType = null;
  }

  /**
   * Add layer by type click wrapper. Prevents bubbling of DOM event
   * @param type - One of 'WMS', 'WFS'
   * @param event - Mouse click event
   */
  selectTypeAndAdd(type: string, event: MouseEvent): void {
    event.preventDefault();
    this.selectedType = type === 'WMS' || type === 'WMTS' ? 'WMS' : type;
    this.addLayerToMap(this.layer.endpoint, {
      ...this.layer,
      useTiles: type === 'WMTS',
    });
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
      onPermissionSaved: this.hsAddDataCatalogueService.reloadData,
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
        message: this.hsLanguageService.getTranslation(
          'DRAW.reallyDeleteThisLayer',
          undefined,
        ),
        note: this.hsLanguageService.getTranslation(
          'DRAW.deleteNote',
          undefined,
        ),
        title: this.hsLanguageService.getTranslation(
          'COMMON.confirmDelete',
          undefined,
        ),
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
