import {Component, Input} from '@angular/core';
import {HsLanguageService} from '../../language/language.service';
@Component({
  selector: 'hs-layer-manager-folder',
  templateUrl: './layermanager-folder.component.html',
})
export class HsLayerManagerFolderComponent {
  @Input() folder: any;
  

  constructor(
    public HsLanguageService: HsLanguageService /* Used in template */
  ) {}
}
