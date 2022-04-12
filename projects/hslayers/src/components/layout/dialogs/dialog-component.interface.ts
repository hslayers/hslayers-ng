import {HsDialogItem} from './dialog-item';
import {ViewRef} from '@angular/core';

export interface HsDialogComponent {
  cleanup?(): void;
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: any;
}
