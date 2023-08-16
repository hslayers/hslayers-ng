import {Component, Input} from '@angular/core';

import {HsConfig} from '../../config.service';

@Component({
  selector: 'hs-impressum',
  templateUrl: './partials/impressum.html',
})
export class HsImpressumComponent {
  version = 'dev';
  logo = '';
  logoDisabled = false;
  logoPath: string;
  constructor(public hsConfig: HsConfig) {
    this.version = '12.0.0-next.1';
  }

  ngOnInit() {
    this.logoPath = this.hsConfig.assetsPath + 'img/hslayers-ng-logo.png';
  }
}
