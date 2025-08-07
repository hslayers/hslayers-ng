import {Component, ViewRef, inject} from '@angular/core';
import {KeyValuePipe} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {HsCompositionsService} from '../compositions.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsClipboardTextComponent} from 'hslayers-ng/common/clipboard-text';

@Component({
  selector: 'hs-compositions-info-dialog',
  templateUrl: './info-dialog.component.html',
  standalone: true,
  imports: [TranslatePipe, HsClipboardTextComponent, KeyValuePipe],
})
export class HsCompositionsInfoDialogComponent implements HsDialogComponent {
  hsDialogContainerService = inject(HsDialogContainerService);
  hsCompositionsService = inject(HsCompositionsService);

  viewRef: ViewRef;
  data: {
    info: {
      title: string;
      abstract: string;
      metadata?: {
        [key: string]: any;
      };
      contactAddress?: {
        [key: string]: any;
      };
      contactPersonPrimary?: {
        [key: string]: any;
      };
      [key: string]: any;
    };
  };

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }
}
