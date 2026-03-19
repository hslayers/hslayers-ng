import {Component, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsAddDataCommonFileService,
  HsAddDataCommonService,
  HsAddDataVectorService,
} from 'hslayers-ng/services/add-data';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsCommonUrlComponent} from '../../common/url/url.component';
import {HsHistoryListService} from 'hslayers-ng/common/history-list';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsNewLayerFormComponent} from '../../common/new-layer-form/new-layer-form.component';
import {HsUrlGeoSparqlService} from './geosparql.service';
import {HsUrlProgressComponent} from '../../common/url/progress/progress.component';

@Component({
  selector: 'hs-url-geosparql',
  templateUrl: './geosparql.component.html',
  imports: [
    FormsModule,
    HsCommonUrlComponent,
    HsUrlProgressComponent,
    NgClass,
    HsNewLayerFormComponent,
    HsAddToMapButtonComponent,
    TranslatePipe,
  ],
})
export class HsUrlGeoSparqlComponent {
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsAddDataCommonFileService = inject(HsAddDataCommonFileService);
  hsAddDataVectorService = inject(HsAddDataVectorService);
  hsHistoryListService = inject(HsHistoryListService);
  hsLayoutService = inject(HsLayoutService);
  hsUrlGeoSparqlService = inject(HsUrlGeoSparqlService);

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

  constructor() {
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
