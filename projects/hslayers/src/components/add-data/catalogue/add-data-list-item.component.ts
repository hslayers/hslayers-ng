/* eslint-disable @typescript-eslint/no-unused-vars */
import {Component, Input} from '@angular/core';

import {HsAddDataCatalogueService} from './add-data-catalogue.service';
import {HsAddDataLayerDescriptor} from './add-data-layer-descriptor.interface';
import {HsAddDataMetadataDialogComponent} from './add-data-catalogue-metadata-dialog.component';
import {HsAddDataMetadataService} from './add-data-catalogue-metadata.service';
import {HsConfig} from '../../../config.service';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../../language/language.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLogService} from '../../../common/log/log.service';

@Component({
  selector: 'hs-add-data-list-item',
  templateUrl: 'add-data-list-item.html',
})
export class HsAddDataListItemComponent {
  @Input() layer;

  explanationsVisible: boolean;
  metadata;
  metadataModalVisible: boolean;
  selected_ds;
  selected_layer;
  selectedType: string; //do not rename to 'type', would clash in the template
  selectTypeToAddLayerVisible: boolean;
  whatToAddTypes;

  constructor(
    public hsConfig: HsConfig, //used in template
    public hsDatasourcesMetadataService: HsAddDataMetadataService,
    public HsAddDataCatalogueService: HsAddDataCatalogueService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLaymanBrowserService: HsLaymanBrowserService,
    public hsLogService: HsLogService,
    public HsLanguageService: HsLanguageService
  ) {}

  /**
   * @function addLayerToMap
   * @param {object} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @description Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
   */
  async addLayerToMap(
    ds: HsEndpoint,
    layer: HsAddDataLayerDescriptor
  ): Promise<void> {
    const availableTypes = await this.HsAddDataCatalogueService.addLayerToMap(
      ds,
      layer,
      this.selectedType
    );
    if (Array.isArray(availableTypes)) {
      this.whatToAddTypes = availableTypes;
      this.selectTypeToAddLayerVisible = true;
    } else {
      this.selectTypeToAddLayerVisible = false;
      this.selectedType = null;
    }
    this.metadataModalVisible = false;
    this.explanationsVisible = false;
  }

  abortAdd(): void {
    this.selectTypeToAddLayerVisible = false;
    this.explanationsVisible = false;
    this.selectedType = null;
  }

  /**
   * @description Add layer by type click wrapper. Prevents bubbling of DOM event
   * @param type One of 'WMS', 'WFS'
   * @param event Mouse click event
   */
  selectTypeAndAdd(type: string, event: MouseEvent): void {
    event.preventDefault();
    this.selectedType = type;
    this.addLayerToMap(this.layer.endpoint, this.layer);
  }

  /**
   * @description For a stringified type of service, it returns its description
   * @param type One of 'WMS', 'WFS'
   * @returns A brief description of a given type with its main advantage and disadvantage notes
   */
  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  toggleExplanations(): void {
    this.explanationsVisible = !this.explanationsVisible;
  }

  /**
   * @function showMetadata
   * @param {HsEndpoint} endpoint Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @description Show metadata record dialog window for selected layer.
   */
  async showMetadata(
    endpoint: HsEndpoint,
    layer: HsAddDataLayerDescriptor
  ): Promise<void> {
    this.selected_layer = layer;
    this.selected_ds = endpoint;

    if (endpoint.type == 'layman') {
      await this.hsLaymanBrowserService.fillLayerMetadata(endpoint, layer);
    }
    //this.metadata = this.hsDatasourcesMetadataService.decomposeMetadata(layer);
    //console.log(this.metadata);

    this.hsDialogContainerService.create(HsAddDataMetadataDialogComponent, {
      selectedLayer: this.selected_layer,
      selectedDS: this.selected_ds,
    });
  }
}
