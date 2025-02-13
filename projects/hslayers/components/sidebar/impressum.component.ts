import {Component, OnInit} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';

@Component({
  selector: 'hs-impressum',
  templateUrl: './impressum.component.html',
  standalone: false,
})
export class HsImpressumComponent implements OnInit {
  version = 'dev';
  logo = '';
  logoDisabled = false;
  logoPath: string;
  constructor(public hsConfig: HsConfig) {
    this.version = '15.0.0-next.2';
  }

  ngOnInit() {
    this.logoPath = this.hsConfig.assetsPath + 'img/hslayers-ng-logo.png';
  }
}
