import {AfterContentInit, Component, Input} from '@angular/core';

import {HsAddDataService} from './../../add-data.service';
import {HsAddDataUrlService} from './../../url/add-data-url.service';
import {HsAddDataUrlWmsService} from '../../url/wms/add-data-url-wms.service';
import {HsLanguageService} from '../../../../components/language/language.service';
import {HsUtilsService} from '../../../utils/utils.service';

@Component({
  selector: 'hs-common-url-show-details',
  templateUrl: './common-url-show-details.component.html',
})
export class HsCommonUrlShowDetailsComponent implements AfterContentInit {
  @Input() injectedService: any;
  @Input() type: string;
  data;
  sourceHistory;
  hasChecked = false;
  checkedLayers = {};
  hasNestedLayers: any;
  getDimensionValues: any;
  limitShown = 100;
  constructor(
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsAddDataUrlWmsService: HsAddDataUrlWmsService
  ) {}
  ngAfterContentInit(): void {
    this.data = this.injectedService.data;
    this.hasNestedLayers = this.injectedService.hasNestedLayers;
    this.getDimensionValues = this.injectedService.getDimensionValues;
    this.sourceHistory = this.injectedService.sourceHistory;
  }

  srsChanged(): void {
    this.injectedService.srsChanged();
  }
  //NOT BEING USED
  /**
   * @description Clear Url and hide detailsWms
   */
  clear(): void {
    this.injectedService.url = '';
    this.injectedService.showDetails = false;
  }

  searchForChecked(service): void {
    this.checkedLayers[service.Name] = service.checked;
    this.hasChecked = Object.values(this.checkedLayers).some(
      (value) => value === true
    );
  }

  reachedLimit(): boolean {
    if (this.data.services?.length > this.limitShown) {
      return true;
    } else {
      return false;
    }
  }
  changed(): void {
    this.hasChecked = this.hsAddDataUrlService.searchForChecked(
      this.data.services
    );
  }
}
