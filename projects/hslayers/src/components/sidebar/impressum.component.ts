import {Component} from '@angular/core';

import * as packageJson from '../../package.json';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-impressum',
  templateUrl: './partials/impressum.html',
})
export class HsImpressumComponent {
  version = 'dev';
  logo = '';
  logoDisabled = true;
  constructor(public hsUtilsService: HsUtilsService) {
    this.version = packageJson.version;
  }
}
