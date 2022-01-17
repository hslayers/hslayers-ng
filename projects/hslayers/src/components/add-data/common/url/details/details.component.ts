import {AfterContentInit, Component, Input} from '@angular/core';

import {AddDataUrlType} from '../../../url/types/url.type';
import {HsAddDataCommonService} from '../../common.service';
import {HsAddDataService} from '../../../add-data.service';
import {HsAddDataUrlService} from '../../../url/add-data-url.service';
import {HsLanguageService} from '../../../../language/language.service';
import {HsLayerUtilsService} from '../../../../utils/layer-utils.service';
import {HsUrlTypeServiceModel} from '../../../url/models/url-type-service.model';
import {HsUrlWmsService} from '../../../url/wms/wms.service';
import {HsUtilsService} from '../../../../utils/utils.service';

@Component({
  selector: 'hs-url-details',
  templateUrl: './details.component.html',
})
export class HsUrlDetailsComponent implements AfterContentInit {
  @Input() injectedService: HsUrlTypeServiceModel;
  @Input() type: AddDataUrlType;
  data;
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
    public hsUrlWmsService: HsUrlWmsService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {}
  ngAfterContentInit(): void {
    this.data = this.injectedService.data;
    this.hasNestedLayers = this.hsLayerUtilsService.hasNestedLayers;
    this.getDimensionValues = this.hsAddDataCommonService.getDimensionValues;
  }

  srsChanged(): void {
    this.data.resample_warning = this.hsAddDataCommonService.srsChanged(
      this.data.srs
    );
  }

  searchForChecked(service): void {
    this.checkedSubLayers[service.Name] = service.checked;
    this.hsAddDataUrlService.addingAllowed = Object.values(
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

  addService(service): void {
    if (this.injectedService.addService) {
      this.injectedService.addService(service);
    }
  }
}
