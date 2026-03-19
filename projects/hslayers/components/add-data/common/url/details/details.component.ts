import {AfterContentInit, Component, Input, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SlicePipe} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {EpsgPipe} from 'hslayers-ng/common/pipes';
import {
  AddDataUrlType,
  UrlDataObject,
  HsUrlTypeServiceModel,
} from 'hslayers-ng/types';
import {HsAddDataCommonService} from 'hslayers-ng/services/add-data';
import {HsAddUrlAsToggleComponent} from '../add-as-toggle/add-as-toggle.component';
import {HsPositionComponent} from '../../target-position/target-position.component';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {HsUrlAddComponent} from '../add/add.component';

@Component({
  selector: 'hs-url-details',
  templateUrl: './details.component.html',
  imports: [
    FormsModule,
    HsAddUrlAsToggleComponent,
    HsPositionComponent,
    HsLayerTableComponent,
    HsUrlAddComponent,
    SlicePipe,
    TranslatePipe,
    EpsgPipe,
  ],
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
