/* eslint-disable @typescript-eslint/no-unused-vars */
import {Component, Input} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsDatasourceLayerDescriptor} from './datasource-layer-descriptor.interface';
import {HsDatasourcesMetadataDialogComponent} from './datasource-metadata-dialog.component';
import {HsDatasourcesMetadataService} from './datasource-selector-metadata.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsLogService} from '../../common/log/log.service';

@Component({
  selector: 'hs-datasource-list-item',
  templateUrl: './partials/datasource-list-item.html',
})
export class HsDatasourceListItemComponent {
  @Input() layer;
  @Input() endpoint;

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
    public hsDatasourcesMetadataService: HsDatasourcesMetadataService,
    public hsDatasourcesService: HsDatasourcesService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLaymanBrowserService: HsLaymanBrowserService,
    public hsLogService: HsLogService
  ) {}

  /**
   * @function addLayerToMap
   * @param {object} ds Datasource of selected layer
   * @param {object} layer Metadata record of selected layer
   * @description Add selected layer to map (into layer manager) if possible (supported formats: WMS, WFS, Sparql, kml, geojson, json)
   */
  async addLayerToMap(
    ds: HsEndpoint,
    layer: HsDatasourceLayerDescriptor
  ): Promise<void> {
    const availableTypes = await this.hsDatasourcesService.addLayerToMap(
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
   * @description For a stringified type of service, it returns its description
   * @param type One of 'WMS', 'WFS'
   * @returns A brief description of a given type with its main advantage and disadvantage notes
   */
  getTypeDescription(type: string): string {
    switch (type.toLowerCase()) {
      case 'wms':
        return 'Web Map Service: it adds the layer as a raster image. The transferred data is usually smaller so it generally loads faster. Yet it does not give you the access to the underlaying layer features.';
      case 'wfs':
        return 'Web Feature Service: it adds the layer as a set of vector features. It is more power-consuming, especially with large layers, but it allows to edit features or to display individual feature info.';
      default:
        return 'this type is unknown to HSLayers-NG ...';
    }
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
    layer: HsDatasourceLayerDescriptor
  ): Promise<void> {
    this.selected_layer = layer;
    this.selected_ds = endpoint;

    if (endpoint.type == 'layman') {
      await this.hsLaymanBrowserService.fillLayerMetadata(endpoint, layer);
    }
    //this.metadata = this.hsDatasourcesMetadataService.decomposeMetadata(layer);
    //console.log(this.metadata);

    this.hsDialogContainerService.create(
      HsDatasourcesMetadataDialogComponent,
      {
        selectedLayer: this.selected_layer,
        selectedDS: this.selected_ds,
      }
    );
  
  }

  /**
   *
   */
  metadataMdDialog(): void {
    try {
      //FIXME:
      this.hsLogService.warn('not implemented');
      //const $mdDialog = this.$injector.get('$mdDialog');

      /*$mdDialog.show({
        parent: angular.element('#hsContainer'),
        clickOutsideToClose: true,
        escapeToClose: true,
        scope: this.$scope,
        preserveScope: true,
        templateUrl: './partials/datasourceBrowserMetadata.html',
        controller: function DialogController($scope, $mdDialog) {
          $scope.closeDialog = function () {
            $mdDialog.hide();
          };
        },
      });*/
    } catch (ex) {
      //this.HsLogService.error('Failed to create metadataDialog.');
      // continue regardless of error
    }
  }
}
