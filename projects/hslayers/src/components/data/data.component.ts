import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
// import {HsDragDropLayerService} from './drag-drop-layer.service';
import {HsDataService} from './data.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';


@Component({
  selector: 'hs-data',
  templateUrl: './data.directive.html',
})
export class HsDataComponent {
  types: any[];
  type: string;

  constructor(
    public HsDataService: HsDataService,
    public HsLanguageService: HsLanguageService,
    public HsShareUrlService: HsShareUrlService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService

  ) {
    this.HsDataService.typeSelected = 'catalogue';

    console.log('wmstoconnect')
    this.connectServiceFromUrlParam('wms');
    this.connectServiceFromUrlParam('wfs');
  }

  datasetSelect(type: string): void {
    this.HsDataService.selectType(type);
  }

  
  connectServiceFromUrlParam(type: string): void {
    const url = this.HsShareUrlService.getParamValue(`${type}_to_connect`);
    if (url) {
      this.HsLayoutService.setMainPanel('data');
      this.HsDataService.typeSelected = 'url';
      this.HsDataService.urlType = type;
    }
  }
}
