import GeoJSON from 'ol/format/GeoJSON';
import {Component} from '@angular/core';
import {HsAddLayersVectorService} from './add-layers-vector.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsLayoutService} from '../../layout/layout.service';
import {get as getProjection} from 'ol/proj';
@Component({
  selector: 'hs-add-layers-vector',
  template: require('./add-vector-layer.directive.html'),
})
export class HsAddLayersVectorComponent {
  srs = 'EPSG:4326';
  title = '';
  extract_styles = false;
  abstract: string;
  url: string;
  name = '';
  advancedPanelVisible = false;
  folder_name = '';
  dropzoneActive = false;
  constructor(
    public hsAddLayersVectorService: HsAddLayersVectorService,
    public hsHistoryListService: HsHistoryListService,
    public hsLayoutService: HsLayoutService
  ) {}

  connect = (): void => {
    this.hsHistoryListService.addSourceHistory('vector', this.url);
    //this.showDetails = true;
  };

  /**
   * Handler for adding nonwms service, file in template.
   *
   * @function add
   */
  async add() {
    const layer = await this.hsAddLayersVectorService.addVectorLayer(
      '',
      this.url,
      this.name,
      this.title,
      this.abstract,
      this.srs,
      {extractStyles: this.extract_styles}
    );
    this.hsAddLayersVectorService.fitExtent(layer);
    this.hsLayoutService.setMainPanel('layermanager');
    return layer;
  }
  dropZoneState($event: boolean): void {
    this.dropzoneActive = $event;
  }
  handleFileUpload(fileList: FileList): void {
    Array.from(fileList).forEach((f) => {
      this.readUploadedFile(f);
    });
  }
  readUploadedFile(file: any): void {
    const reader = new FileReader();
    reader.onload = async () => {
      const json = JSON.parse(<string>reader.result);
      if (json.features.length > 0) {
        const format = new GeoJSON();
        const options = {
          features: format.readFeatures(json),
        };
        const data = {
          title: json.name,
          projection: getProjection(json.crs.properties.name),
        };
        const layer = await this.hsAddLayersVectorService.addVectorLayer(
          '',
          undefined,
          data.title || 'Layer', //name
          data.title || 'Layer',
          '',
          data.projection || this.srs,
          options
        );
        this.hsAddLayersVectorService.fitExtent(layer);
      }
    };
    reader.readAsText(file);
  }
}
