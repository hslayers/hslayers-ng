import {AddDataUrlType} from '../../../url/types/url.type';
import {AfterContentInit, Component, Input} from '@angular/core';
import {HsAddDataCommonService} from '../../common.service';
import {HsAddDataService} from '../../../add-data.service';
import {HsAddDataUrlService} from '../../../url/add-data-url.service';
import {HsLanguageService} from '../../../../language/language.service';
import {HsLayerUtilsService} from '../../../../utils/layer-utils.service';
import {
  HsUrlTypeServiceModel,
  Service,
} from '../../../url/models/url-type-service.model';
import {HsUrlWmsService} from '../../../url/wms/wms.service';
import {HsUtilsService} from '../../../../utils/utils.service';
@Component({
  selector: 'hs-layer-table',
  templateUrl: './layer-table.component.html',
})
export class HsLayerTableComponent implements AfterContentInit {
  @Input() injectedService: HsUrlTypeServiceModel;
  @Input() type: AddDataUrlType;

  data;
  checkedSubLayers = {};
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
    this.getDimensionValues = this.hsAddDataCommonService.getDimensionValues;
  }

  reachedLimit(): boolean {
    if (
      this.data.layers?.length > this.limitShown ||
      this.data.services?.length > this.limitShown
    ) {
      return true;
    } else {
      return false;
    }
  }

  changed(whichArray: 'layers' | 'services'): void {
    if (whichArray == 'layers') {
      this.hsAddDataUrlService.searchForChecked(this.data.layers);
    }
    if (whichArray == 'services') {
      this.hsAddDataUrlService.searchForChecked(this.data.services);
    }
  }

  /**
   * Collapse ArcGIS MapServer expanded service. Used as a way to step back
   */
  collapseServices() {
    if (this.injectedService.collapseServices) {
      this.injectedService.collapseServices();
    }
  }

  async expandService(service: Service): Promise<void> {
    if (this.injectedService.expandService) {
      this.injectedService.expandService(service);
      if (
        this.injectedService.isImageService &&
        this.injectedService.isImageService()
      ) {
        const layers = await this.injectedService.getLayers();
        this.injectedService.addLayers(layers);
      }
    }
  }

  searchForChecked(layer): void {
    this.checkedSubLayers[layer.Name] = layer.checked;
    this.hsAddDataUrlService.addingAllowed = Object.values(
      this.checkedSubLayers
    ).some((value) => value === true);
  }

  getLimitTextTranslation(): string {
    return this.hsLanguageService.getTranslation(
      'ADDDATA.CATALOGUE.showingSubset',
      {limitShown: this.limitShown, total: this.data.layers.length}
    );
  }
}
