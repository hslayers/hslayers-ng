import {AfterContentInit, Component, Input} from '@angular/core';

import {AddDataUrlType, UrlDataObject} from 'hslayers-ng/types';
import {HsAddDataCommonService} from 'hslayers-ng/services/add-data';
import {HsUrlTypeServiceModel} from 'hslayers-ng/types';

@Component({
  selector: 'hs-url-details',
  templateUrl: './details.component.html',
  styles: `
    .hs-add-url-wms-addas button {
      min-width: 5rem;
    }
  `,
  standalone: false,
})
export class HsUrlDetailsComponent implements AfterContentInit {
  @Input() injectedService: HsUrlTypeServiceModel;
  @Input() type: AddDataUrlType;

  data: UrlDataObject;
  getDimensionValues: any;
  advancedPanelVisible = false;
  constructor(public hsAddDataCommonService: HsAddDataCommonService) {}
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
}
