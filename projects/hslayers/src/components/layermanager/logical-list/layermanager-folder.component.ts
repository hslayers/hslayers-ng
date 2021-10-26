import {Component, Input} from '@angular/core';
import {HsLanguageService} from '../../language/language.service';
@Component({
  selector: 'hs-layer-manager-folder',
  templateUrl: './folder.html',
})
export class HsLayerManagerFolderComponent {
  @Input() folder: any;

  constructor(
    public HsLanguageService: HsLanguageService /* Used in template */
  ) {}

  /**
   * @public
   * @param {object} obj Folder object of current hierarchy
   * @returns {boolean} True if subfolders exists
   * @description Find if current folder has any subfolder
   */
  folderVisible(obj): boolean {
    return obj.sub_folders.length > 0;
  }
}
