import {ViewRef} from '@angular/core';

import {HsDialogItem} from './dialog-item';

export interface HsDialogComponent {
  cleanup?(): void;
  dialogItem?: HsDialogItem;
  viewRef: ViewRef;
  data: any;
}
