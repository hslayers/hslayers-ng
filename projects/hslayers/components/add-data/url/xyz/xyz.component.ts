import {Component, inject, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlXyzService,
} from 'hslayers-ng/services/add-data';

import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsAddUrlAsToggleComponent} from '../../common/url/add-as-toggle/add-as-toggle.component';
import {HsCommonUrlComponent} from '../../common/url/url.component';
import {HsPositionComponent} from '../../common/target-position/target-position.component';
import {HsUrlProgressComponent} from '../../common/url/progress/progress.component';
import {UrlDataObject} from 'hslayers-ng/types';

@Component({
  selector: 'hs-url-xyz',
  templateUrl: './xyz.component.html',
  imports: [
    HsCommonUrlComponent,
    HsUrlProgressComponent,
    FormsModule,
    HsAddUrlAsToggleComponent,
    NgClass,
    HsPositionComponent,
    HsAddToMapButtonComponent,
    TranslatePipe,
  ],
})
export class HsUrlXyzComponent implements OnInit {
  hsUrlXyzService = inject(HsUrlXyzService);
  hsAddDataCommonService = inject(HsAddDataCommonService);
  hsAddDataOwsService = inject(HsAddDataOwsService);

  data: UrlDataObject;
  advancedPanelVisible = false;

  ngOnInit(): void {
    this.data = this.hsUrlXyzService.data;
  }

  async add(): Promise<void> {
    const layers = await this.hsUrlXyzService.getLayers(false);
    this.hsUrlXyzService.addLayers(layers);
    this.hsUrlXyzService.finalizeLayerRetrieval(layers);
  }

  setBase(state: boolean) {
    this.data.base = state;
    this.data.group = state || this.data.group;
  }

  setApiKey(state: boolean) {
    this.data.useApiKey = state;
    // Clear API key data when disabled
    if (!state) {
      this.data.apiKey = '';
    }
  }
}
