import {AfterContentInit, Component, Input} from '@angular/core';

import {HsAddDataCommonUrlService} from '../add-data-common.service';
import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../../url/add-data-url.service';
import {HsAddDataUrlWmsService} from '../../url/wms/add-data-url-wms.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsUtilsService} from '../../../utils/utils.service';

@Component({
  selector: 'hs-common-url-details',
  templateUrl: './common-url-details.component.html',
})
export class HsCommonUrlDetailsComponent implements AfterContentInit {
  @Input() injectedService: any;
  @Input() type: string;
  data;
  sourceHistory;
  checkedSubLayers = {};
  hasNestedLayers: any;
  getDimensionValues: any;
  limitShown = 100;
  constructor(
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsUtilsService: HsUtilsService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsAddDataUrlWmsService: HsAddDataUrlWmsService,
    public hsAddDataCommonUrlService: HsAddDataCommonUrlService
  ) {}
  ngAfterContentInit(): void {
    this.hsAddDataUrlService.hasAnyChecked = false;
    this.data = this.injectedService.data;
    this.hasNestedLayers = this.hsLayerUtilsService.hasNestedLayers;
    this.getDimensionValues = this.injectedService.getDimensionValues;
    this.sourceHistory = this.injectedService.sourceHistory;
  }

  srsChanged(): void {
    this.data.resample_warning = this.hsAddDataCommonUrlService.srsChanged(
      this.data.srs
    );
  }
  //NOT BEING USED
  /**
   * Clear Url and hide detailsWms
   */
  clear(): void {
    this.injectedService.url = '';
    this.injectedService.showDetails = false;
  }

  searchForChecked(service): void {
    this.checkedSubLayers[service.Name] = service.checked;
    this.hsAddDataUrlService.hasAnyChecked = Object.values(
      this.checkedSubLayers
    ).some((value) => value === true);
  }

  reachedLimit(): boolean {
    if (this.data.services?.length > this.limitShown) {
      return true;
    } else {
      return false;
    }
  }
  changed(): void {
    this.hsAddDataUrlService.searchForChecked(this.data.services);
  }
}
