import {AfterContentInit, Component, Input} from '@angular/core';

import {AddDataUrlType} from '../../../url/types/url.type';
import {HsAddDataCommonService} from '../../common.service';
import {HsUrlTypeServiceModel} from '../../../url/models/url-type-service.model';

@Component({
  selector: 'hs-url-details',
  templateUrl: './details.component.html',
})
export class HsUrlDetailsComponent implements AfterContentInit {
  @Input() injectedService: HsUrlTypeServiceModel;
  @Input() type: AddDataUrlType;

  data;
  getDimensionValues: any;
  advancedPanelVisible = false;
  constructor(public hsAddDataCommonService: HsAddDataCommonService) {}
  ngAfterContentInit(): void {
    this.data = this.injectedService.data;
    this.getDimensionValues = this.hsAddDataCommonService.getDimensionValues;
  }

  srsChanged(): void {
    this.data.resample_warning = this.hsAddDataCommonService.srsChanged(
      this.data.srs,
    );
  }
}
