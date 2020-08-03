import {Component, Input} from '@angular/core';
@Component({
  selector: 'hs-sync-error-dialog',
  template: require('./sync-error-dialog.html'),
})
export class HsSyncErrorDialogComponent {
  @Input() exception: any;
}
