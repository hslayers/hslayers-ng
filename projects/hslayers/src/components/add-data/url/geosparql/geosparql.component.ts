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
  };

  constructor(
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsHistoryListService: HsHistoryListService,
    public hsUrlGeoSparqlService: HsUrlGeoSparqlService
  ) {
    this.data = {
      showDetails: false,
      url: undefined,
    };
  }

  connect = async (): Promise<void> => {
    this.hsHistoryListService.addSourceHistory('geosparql', this.data.url);
    this.data.showDetails = true;
  };
}
