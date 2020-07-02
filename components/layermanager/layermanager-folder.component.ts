import {Component, Input} from '@angular/core';
@Component({
  selector: 'hs-layer-manager-folder',
  template: require('./partials/folder.html'),
})
export class HsLayerManagerFolderComponent {
  @Input() folder: any;

  /**
   * @ngdoc method
   * @name hs.layermanager.folderDirective#folderVisible
   * @public
   * @param {object} obj Folder object of current hiearchy
   * @returns {boolean} True if subfolders exists
   * @description Find if current folder has any subfolder
   */
  folderVisible(obj) {
    return obj.sub_folders.length > 0;
  }
}
