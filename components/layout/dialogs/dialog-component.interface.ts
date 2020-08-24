import {HsDialogItem} from './dialog-item';
import {ViewRef} from '@angular/core';

export interface HsDialogComponent {
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: any;
}
