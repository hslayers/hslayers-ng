import BaseLayer from 'ol/layer/Base';
import {Component} from '@angular/core';
import {HsDataService} from '../data.service';
import {HsDataVectorService} from './data-vector.service';
import {HsHistoryListService} from '../../../common/history-list/history-list.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsUtilsService} from '../../utils/utils.service';

@Component({
  selector: 'hs-data-url-vector',
  templateUrl: './data-vector.directive.html',
})
export class HsDataVectorComponent {
  srs = 'EPSG:4326';
  title = '';
  extract_styles = true;
  abstract: string;
  url: string;
  base64url: string;
  name = '';
  advancedPanelVisible = false;
  folder_name = '';
  dropzoneActive = false;
  features: any[] = [];
  featureCount = 0;
  type = '';
  errorOccured = false;
  addUnder: BaseLayer = null;

  constructor(
    public HsDataVectorService: HsDataVectorService,
    public hsHistoryListService: HsHistoryListService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public HsDataService: HsDataService
  ) {}

  connect = (): void => {
    this.hsHistoryListService.addSourceHistory('vector', this.url);
    this.isKml();
    //this.showDetails = true;
  };

  isKml(): boolean {
    if (this.type == 'kml' || this.url?.endsWith('kml')) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Handler for adding nonwms service, file in template.
   *
   * @function add
   */
  async add() {
    const layer = await this.HsDataVectorService.addVectorLayer(
      this.type,
      this.url || this.base64url,
      this.name,
      this.title,
      this.abstract,
      this.srs,
      {
        extractStyles: this.extract_styles,
        features: this.features,
        path: this.hsUtilsService.undefineEmptyString(this.folder_name),
      },
      this.addUnder
    );
    this.HsDataVectorService.fitExtent(layer);
    this.hsLayoutService.setMainPanel('layermanager');
    this.setToDefault();
    return layer;
  }
  dropZoneState($event: boolean): void {
    this.dropzoneActive = $event;
  }
  handleFileUpload(fileList: FileList): any {
    Array.from(fileList).forEach(async (f) => {
      const uploadedData = await this.HsDataVectorService.readUploadedFile(f);
      if (uploadedData !== undefined) {
        uploadedData.url !== undefined
          ? (this.base64url = uploadedData.url)
          : ((this.url = ''), (this.base64url = ''));

        uploadedData.name !== undefined
          ? (this.name = uploadedData.name)
          : (this.name = '');

        uploadedData.title !== undefined
          ? (this.title = uploadedData.title)
          : (this.title = '');

        uploadedData.srs !== undefined
          ? (this.srs = uploadedData.srs.getCode())
          : (this.srs = 'EPSG:4326');

        uploadedData.abstract !== undefined
          ? (this.abstract = uploadedData.abstract)
          : (this.abstract = '');

        if (uploadedData.features !== undefined) {
          this.features = uploadedData.features;
          this.featureCount = uploadedData.features.length;
        } else {
          this.features = [];
          this.featureCount = 0;
        }
        if (uploadedData.type !== undefined) {
          this.type = uploadedData.type;
          this.isKml();
        } else {
          this.type = '';
        }
      } else {
        this.setToDefault();
        this.errorOccured = true;
        setTimeout(() => {
          this.errorOccured = false;
        }, 3000);
      }
    });
  }
  setToDefault(): void {
    this.srs = 'EPSG:4326';
    this.title = '';
    this.extract_styles = true;
    this.abstract = '';
    this.url = '';
    this.base64url = '';
    this.name = '';
    this.advancedPanelVisible = false;
    this.folder_name = '';
    this.dropzoneActive = false;
    this.features = [];
    this.featureCount = 0;
    this.type = '';
  }
}
