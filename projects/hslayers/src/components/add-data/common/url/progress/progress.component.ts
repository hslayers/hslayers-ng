import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {HsAddDataService} from '../../../add-data.service';
import {HsConfig, HsConfigObject} from '../../../../../config.service';
import {HsUtilsService} from '../../../../utils/utils.service';

@Component({
  selector: 'hs-url-progress',
  templateUrl: './progress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsUrlProgressComponent implements OnInit {
  configRef: HsConfigObject;
  constructor(
    public hsAddDataService: HsAddDataService,
    public hsUtilsService: HsUtilsService,
    private hsConfig: HsConfig
  ) {}

  ngOnInit() {
    this.configRef = this.hsConfig;
  }
}
