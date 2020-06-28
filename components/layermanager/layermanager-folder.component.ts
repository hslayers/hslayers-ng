import { Component } from '@angular/core';
@Component({
  selector: 'hs-layer-manager-folder',
  template: require('./partials/folder.html')
})
export class HsLayerManagerFolderComponent {
  obj: any;
  
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
  };

  ngOnInit() {
    /**
     * @ngdoc property
     * @name hs.layermanager.folderDirective#obj
     * @public
     * @type {object}
     * @description Container for folder object of current folder instance. 
     * Either full folders object or its subset based on hierarchy place of directive
     */
    if (this.value === null) {
      this.obj = '-';
    } else {
      this.obj = this.value;
    }


  }

}
