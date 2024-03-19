import {Component} from '@angular/core';

import {HsAddDataCommonFileService} from 'hslayers-ng/services/add-data';
import {HsAddDataCommonService} from 'hslayers-ng/services/add-data';
import {HsAddDataVectorService} from 'hslayers-ng/services/add-data';
import {HsHistoryListService} from 'hslayers-ng/common/history-list';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsUrlGeoSparqlService} from './geosparql.service';

@Component({
  selector: 'hs-url-geosparql',
  templateUrl: './geosparql.component.html',
})
export class HsUrlGeoSparqlComponent {
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
    public hsUrlGeoSparqlService: HsUrlGeoSparqlService,
  ) {
    this.data = {
      type: 'sparql',
    };
    this.querySuccessful = false;
    this.showDetails = false;
    this.validEndpoint = true;
  }

  connect = async (): Promise<void> => {
    this.hsAddDataCommonService.loadingInfo = true;
    this.setDataToDefault();
    const obtainable = await this.hsAddDataCommonFileService.isUrlObtainable(
      this.data.url,
    );
    if (!obtainable) {
      this.hsAddDataCommonService.loadingInfo = false;
      return;
    }
    this.hsHistoryListService.addSourceHistory('geosparql', this.data.url);
    this.validEndpoint = await this.hsUrlGeoSparqlService.verifyEndpoint(
      this.data.url,
    );
    if (this.validEndpoint) {
      this.showDetails = true;
    }
    this.hsAddDataCommonService.loadingInfo = false;
  };

  async add(): Promise<void> {
    const response: {layer; complete: boolean} =
      await this.hsAddDataVectorService.addNewLayer(this.data);
    if (response.complete) {
      this.hsLayoutService.setMainPanel('layerManager');
      this.setDataToDefault();
    }
  }

  findParamsInQuery() {
    this.data.properties = this.hsUrlGeoSparqlService.findParamsInQuery(
      this.data.query,
    );
  }

  private setDataToDefault() {
    this.querySuccessful = false;
    this.showDetails = false;
    this.validEndpoint = true;
  }
}
