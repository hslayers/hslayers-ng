import {Component, Input} from '@angular/core';

import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsUrlGeoSparqlService} from './geosparql.service';

@Component({
  selector: 'hs-url-geosparql',
  templateUrl: './geosparql.component.html',
})
export class HsUrlGeoSparqlComponent {
  @Input() app = 'default';
  data: {
    showDetails: boolean;
    url: string;
    validEndpoint: boolean;
  };

  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsHistoryListService: HsHistoryListService,
    public hsUrlGeoSparqlService: HsUrlGeoSparqlService
  ) {
    this.data = {
      showDetails: false,
      url: undefined,
      validEndpoint: true,
    };
  }

  connect = async (): Promise<void> => {
    this.resetData();
    const obtainable = await this.hsAddDataCommonFileService.isUrlObtainable(
      this.data.url,
      this.app
    );
    if (!obtainable) {
      return;
    }
    this.hsHistoryListService.addSourceHistory('geosparql', this.data.url);
    this.data.validEndpoint = await this.hsUrlGeoSparqlService.verifyEndpoint(
      this.data.url
    );
    if (this.data.validEndpoint) {
      this.data.showDetails = true;
    }
  };

  private resetData() {
    this.data.showDetails = false;
    this.data.validEndpoint = true;
  }
}
