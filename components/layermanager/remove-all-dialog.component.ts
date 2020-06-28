import { Component } from '@angular/core';
@Component({
  selector: 'hs-layermanager-remove-all-dialog',
  template: require('./partials/dialog_removeall.html')
})
export class HsLayerManagerRemoveAllDialogComponent {
  removeAllModalVisible:boolean = true;

  constructor() {
  
  }
}
