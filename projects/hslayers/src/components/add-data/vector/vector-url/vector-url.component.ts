import {Component, Input} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsAddDataVectorService} from '../vector.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {vectorDataObject} from '../vector-data.type';

@Component({
  selector: 'hs-url-vector',
  templateUrl: 'vector-url.component.html',
})
export class HsAddDataVectorUrlComponent {
  @Input() dataType: 'geojson' | 'kml' | 'gpx';
  data: vectorDataObject;
  constructor(
    public hsHistoryListService: HsHistoryListService,
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsLayoutService: HsLayoutService
  ) {
    this.setDataToDefault();
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
    this.setDataToDefault();
  }

  setDataToDefault(): void {
    this.data = {
      // Not possible to save KML to layman yet
      abstract: '',
      addUnder: null as Layer<Source>,
      base64url: '',
      dataType: this.dataType,
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
