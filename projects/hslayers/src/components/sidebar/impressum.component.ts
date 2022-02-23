import {Component, Input} from '@angular/core';

import packageJson from '../../package.json';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-impressum',
  templateUrl: './partials/impressum.html',
})
export class HsImpressumComponent {
  @Input() app = 'default';
  version = 'dev';
  logo = '';
  logoDisabled = false;
  constructor(public hsUtilsService: HsUtilsService) {
    this.version = packageJson.version;
  }
}
