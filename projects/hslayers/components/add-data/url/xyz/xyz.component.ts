import {Component, inject, OnInit} from '@angular/core';

import {
  HsAddDataCommonService,
  HsAddDataOwsService,
  HsUrlXyzService,
} from 'hslayers-ng/services/add-data';
import {UrlDataObject} from 'hslayers-ng/types';

@Component({
  selector: 'hs-url-xyz',
  templateUrl: './xyz.component.html',
  standalone: false,
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
