import {Component, Input, OnInit} from '@angular/core';

import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataOwsService} from '../add-data-ows.service';
import {HsUrlWmtsService} from './wmts.service';

@Component({
  selector: 'hs-url-wmts',
  templateUrl: './wmts.component.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsUrlWmtsComponent implements OnInit {
  @Input() app = 'default';
  appRef;
  constructor(
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsUrlWmtsService: HsUrlWmtsService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {}

  ngOnInit() {
    this.appRef = this.hsUrlWmtsService.get(this.app);
  }
}
