import {Component, Input} from '@angular/core';

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
    if (!this.data.url.endsWith('sparql')) {
      //TODO: show some explanatory warning message
      // or do not check this here?
      // or only show warning instead of return?
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
}
