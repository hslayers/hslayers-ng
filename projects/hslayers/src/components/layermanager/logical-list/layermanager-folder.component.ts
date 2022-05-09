import {Component, Input} from '@angular/core';
import {HsLanguageService} from '../../language/language.service';
@Component({
  selector: 'hs-layer-manager-folder',
  templateUrl: './folder.html',
})
export class HsLayerManagerFolderComponent {
  @Input() folder: any;
  @Input() app = 'default';

  constructor(
    public HsLanguageService: HsLanguageService /* Used in template */
  ) {}
}
