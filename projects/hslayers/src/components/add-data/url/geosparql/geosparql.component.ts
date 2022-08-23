import {Component, Input} from '@angular/core';

import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataVectorService} from '../../vector/vector.service';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsUrlGeoSparqlService} from './geosparql.service';

@Component({
  selector: 'hs-url-geosparql',
  templateUrl: './geosparql.component.html',
})
export class HsUrlGeoSparqlComponent {
  @Input() app = 'default';
  querySuccessful: boolean;
  showDetails: boolean;
  validEndpoint: boolean;
  data: {
    abstract?: string;
    geomProperty?: string;
    idProperty?: string;
    name?: string;
    properties?: string[];
    query?: string;
    type: string;
    title?: string;
    url?: string;
  };

  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsAddDataVectorService: HsAddDataVectorService,
    public hsHistoryListService: HsHistoryListService,
    public hsLayoutService: HsLayoutService,
    public hsUrlGeoSparqlService: HsUrlGeoSparqlService
  ) {
    this.data = {
      type: 'sparql',
    };
    this.querySuccessful = false;
    this.showDetails = false;
    this.validEndpoint = true;
  }

  connect = async (): Promise<void> => {
    this.hsAddDataCommonService.get(this.app).loadingInfo = true;
    this.setDataToDefault();
    const obtainable = await this.hsAddDataCommonFileService.isUrlObtainable(
      this.data.url,
      this.app
    );
    if (!obtainable) {
      this.hsAddDataCommonService.get(this.app).loadingInfo = false;
      return;
    }
    this.hsHistoryListService.addSourceHistory('geosparql', this.data.url);
    this.validEndpoint = await this.hsUrlGeoSparqlService.verifyEndpoint(
      this.data.url,
      this.app
    );
    if (this.validEndpoint) {
      this.showDetails = true;
    }
    this.hsAddDataCommonService.get(this.app).loadingInfo = false;
  };

  async add(): Promise<void> {
    const response: {layer; complete: boolean} =
      await this.hsAddDataVectorService.addNewLayer(this.data, this.app);
    if (response.complete) {
      this.hsLayoutService.setMainPanel('layermanager', this.app);
      this.setDataToDefault();
    }
  }

  findParamsInQuery() {
    this.data.properties = this.hsUrlGeoSparqlService.findParamsInQuery(
      this.data.query
    );
  }

  private setDataToDefault() {
    this.querySuccessful = false;
    this.showDetails = false;
    this.validEndpoint = true;
  }
}
