import {Component, OnInit} from '@angular/core';

import {HsConfig} from '../../config.service';

@Component({
  selector: 'hs-impressum',
  templateUrl: './impressum.component.html',
})
export class HsImpressumComponent implements OnInit {
  version = 'dev';
  logo = '';
  logoDisabled = false;
  logoPath: string;
  constructor(public hsConfig: HsConfig) {
    this.version = '13.0.0';
  }

  ngOnInit() {
    this.logoPath = this.hsConfig.assetsPath + 'img/hslayers-ng-logo.png';
  }
}
