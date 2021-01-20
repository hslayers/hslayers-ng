import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
// import {HsDragDropLayerService} from './drag-drop-layer.service';
import {HsAddDataService} from './addData.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';

@Component({
  selector: 'hs-add-data',
  templateUrl: './addData.directive.html',
})
export class HsAddDataComponent {
  types: any[];
  type: string;

  constructor(
    public HsAddDataService: HsAddDataService,
    public HsLanguageService: HsLanguageService,
    public HsShareUrlService: HsShareUrlService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService
  ) {
    this.HsAddDataService.typeSelected = 'catalogue';

    this.connectServiceFromUrlParam('wms');
    this.connectServiceFromUrlParam('wfs');

    console.log(location, window)
  }

  datasetSelect(type: string): void {
    this.HsAddDataService.selectType(type);
  }

  connectServiceFromUrlParam(type: string): void {
    const url = this.HsShareUrlService.getParamValue(`${type}_to_connect`);
    if (url) {
      this.HsLayoutService.setMainPanel('data');
      this.HsAddDataService.typeSelected = 'url';
      this.HsAddDataService.urlType = type;
    }
  }
}
