import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
// import {HsDragDropLayerService} from './drag-drop-layer.service';
import {AddDataUrlType, servicesSupportedByUrl} from './add-data-url-type';
import {DatasetType, HsAddDataService} from './add-data.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';

@Component({
  selector: 'hs-add-data',
  templateUrl: './add-data.component.html',
})
export class HsAddDataComponent {
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsShareUrlService: HsShareUrlService,
    public hsLayoutService: HsLayoutService,
    public hsEventBusService: HsEventBusService
  ) {
    this.hsAddDataService.typeSelected = 'catalogue';
    servicesSupportedByUrl.forEach((type) =>
      this.connectServiceFromUrlParam(type as AddDataUrlType)
    );
  }

  datasetSelect(type: DatasetType): void {
    this.hsAddDataService.selectType(type);
  }

  connectServiceFromUrlParam(type: AddDataUrlType): void {
    const url = this.hsShareUrlService.getParamValue(`hs-${type}-to-connect`);
    if (url) {
      this.hsLayoutService.setMainPanel('data');
      this.hsAddDataService.typeSelected = 'url';
      this.hsAddDataService.urlType = type;
    }
  }
}
