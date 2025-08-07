import {AfterContentInit, Component, Input, inject} from '@angular/core';

import {
  AddDataUrlType,
  UrlDataObject,
  HsUrlTypeServiceModel,
} from 'hslayers-ng/types';
import {HsAddDataCommonService} from 'hslayers-ng/services/add-data';

@Component({
  selector: 'hs-url-details',
  templateUrl: './details.component.html',
  standalone: false,
})
export class HsUrlDetailsComponent implements AfterContentInit {
  hsAddDataCommonService = inject(HsAddDataCommonService);

  @Input() injectedService: HsUrlTypeServiceModel;
  @Input() type: AddDataUrlType;

  data: UrlDataObject;
  getDimensionValues: any;
  advancedPanelVisible = false;

  ngAfterContentInit(): void {
    this.data = this.injectedService.data;
    if (this.type == 'wms') {
      this.data.group = true;
    }
    this.getDimensionValues = this.hsAddDataCommonService.getDimensionValues;
  }

  srsChanged(): void {
    this.data.resample_warning = this.hsAddDataCommonService.srsChanged(
      this.data.srs,
    );
  }

  setBase(state: boolean) {
    this.data.base = state;
    this.data.group = state || this.data.group;
  }

  setGroup(state: boolean) {
    this.data.group = state;
  }
}
