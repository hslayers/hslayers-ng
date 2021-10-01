import {Component, Input} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsAddDataVectorService} from './../add-data-vector.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLayoutService} from '../../../../components/layout/layout.service';
import {addDataVectorDataObject} from '../add-data-vector-data.type';

@Component({
  selector: 'hs-add-data-vector-url',
  templateUrl: 'add-data-vector-url.component.html',
})
export class HsAddDataVectorUrlComponent {
  @Input() dataType: 'geojson' | 'kml' | 'gpx';
  data: addDataVectorDataObject;
  constructor(
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsLayoutService: HsLayoutService
  ) {
    this.setToDefault();
  }
  connect = async (): Promise<void> => {
    this.hsHistoryListService.addSourceHistory(this.dataType, this.data.url);
    this.data.showDetails = true;
  };

  /**
   * Handler for adding non-wms service, file in template.
   */
  async add(): Promise<void> {
    await this.hsAddDataVectorService.addNewLayer(this.data);
    this.hsLayoutService.setMainPanel('layermanager');
    this.setToDefault();
  }

  setToDefault(): void {
    this.data = {
      // Not possible to save KML to layman yet
      abstract: '',
      addUnder: null as Layer<Source>,
      base64url: '',
      dataType: this.dataType,
      errorOccurred: false,
      extract_styles: false,
      featureCount: 0,
      features: [],
      folder_name: '',
      name: '',
      saveAvailable: false,
      saveToLayman: false,
      showDetails: false,
      srs: 'EPSG:4326',
      title: '',
      type: '',
      url: undefined,
    };
  }
}
