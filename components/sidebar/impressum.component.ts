import {Component} from '@angular/core';

import * as packageJson from '../../package.json';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-impressum',
  template: require('./partials/impressum.html'),
})
export class HsImpressumComponent {
  version = 'dev';
  logo = '';
  constructor(public hsUtilsService: HsUtilsService) {
    this.version = packageJson.version;
    this.logo = this.hsUtilsService.resolveEsModule(
      require(/* webpackChunkName: "img" */ '../../hslayers-ng-logo.png')
    );
  }
}
