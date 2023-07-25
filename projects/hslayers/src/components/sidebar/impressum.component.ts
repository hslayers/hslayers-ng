import {Component, Input} from '@angular/core';

import {HsConfig} from '../../config.service';

@Component({
  selector: 'hs-impressum',
  templateUrl: './partials/impressum.html',
})
export class HsImpressumComponent {
  @Input() app = 'default';
  version = 'dev';
  logo = '';
  logoDisabled = false;
  logoPath: string;
  constructor(public hsConfig: HsConfig) {
    this.version = '11.2.3';
  }

  ngOnInit() {
    this.logoPath =
      this.hsConfig.get(this.app).assetsPath + 'img/hslayers-ng-logo.png';
  }
}
