import {Component, Input} from '@angular/core';

import {HsLanguageService} from '../../language/language.service';

@Component({
  selector: 'hs-layer-manager-folder',
  templateUrl: './layer-manager-folder.component.html',
})
export class HsLayerManagerFolderComponent {
  @Input() folder: any;

  constructor(public HsLanguageService: HsLanguageService) {}
}
