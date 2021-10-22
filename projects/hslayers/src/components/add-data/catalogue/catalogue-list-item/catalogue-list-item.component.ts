/* eslint-disable @typescript-eslint/no-unused-vars */
import {Component, Input} from '@angular/core';

import {HsAddDataCatalogueService} from '../catalogue.service';
import {HsAddDataLayerDescriptor} from '../layer-descriptor.model';
import {HsCatalogueMetadataComponent} from '../catalogue-metadata/catalogue-metadata.component';
import {HsCatalogueMetadataService} from '../catalogue-metadata/catalogue-metadata.service';
import {HsCommonEndpointsService} from './../../../../common/endpoints/endpoints.service';
import {HsConfig} from '../../../../config.service';
import {HsConfirmDialogComponent} from '../../../../common/confirm/confirm-dialog.component';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../../../language/language.service';
import {HsLaymanBrowserService} from '../layman/layman.service';
import {HsLaymanService} from '../../../save-map/layman.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsUtilsService} from '../../../utils/utils.service';
@Component({
  selector: 'hs-catalogue-list-item',
  templateUrl: 'catalogue-list-item.component.html',
})
export class HsCatalogueListItemComponent {
  @Input() layer;

  explanationsVisible: boolean;
  metadata;
  selected_ds;
  selected_layer;
  selectedType: string; //do not rename to 'type', would clash in the template
  selectTypeToAddLayerVisible: boolean;
  whatToAddTypes;
  loadingInfo = false;
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
    public hsCommonEndpointsService: HsCommonEndpointsService
  ) {}

  /**
   * Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
   * @param endpoint - Datasource of selected layer
   * @param layer - Metadata record of selected layer
   */
  async addLayerToMap(
    endpoint: HsEndpoint,
    layer: HsAddDataLayerDescriptor
  ): Promise<void> {
    this.loadingInfo = true;
    const availableTypes = await this.hsAddDataCatalogueService.addLayerToMap(
      endpoint,
      layer,
      this.selectedType
    );
    this.loadingInfo = false;
    if (Array.isArray(availableTypes)) {
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
    this.selectedType = type;
    this.addLayerToMap(this.layer.endpoint, this.layer);
  }

  /**
   * For a stringified type of service, it returns its description
   * @param module -
   * @param text -
   * @returns A brief description of a given type with its main advantage and disadvantage notes
   */
  translateString(module: string, text: string): string {
    return this.hsLanguageService.getTranslationIgnoreNonExisting(module, text);
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
    layer: HsAddDataLayerDescriptor
  ): Promise<void> {
    this.selected_layer = layer;
    this.selected_ds = endpoint;

    if (endpoint.type == 'layman') {
      await this.hsLaymanBrowserService.fillLayerMetadata(endpoint, layer);
    }
    //this.metadata = this.hsDatasourcesMetadataService.decomposeMetadata(layer);
    //console.log(this.metadata);

    this.hsDialogContainerService.create(HsCatalogueMetadataComponent, {
      selectedLayer: this.selected_layer,
      selectedDS: this.selected_ds,
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
          'DRAW.reallyDeleteThisLayer'
        ),
        note: this.hsLanguageService.getTranslation('DRAW.deleteNote'),
        title: this.hsLanguageService.getTranslation('COMMON.confirmDelete'),
      }
    );
    const confirmed = await dialog.waitResult();
    if (confirmed == 'yes') {
      this.hsLaymanService.removeLayer(layer.name);
      this.hsAddDataCatalogueService.catalogEntries =
        this.hsAddDataCatalogueService.catalogEntries.filter((item) => {
          return item.id != layer.id;
        });
    }
  }
}
