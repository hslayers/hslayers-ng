import {Component, ViewRef} from '@angular/core';

import {HsCompositionsService} from '../compositions.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {HsClipboardTextComponent} from 'hslayers-ng/common/clipboard-text';
import {KeyValuePipe} from '@angular/common';

@Component({
  selector: 'hs-compositions-info-dialog',
  templateUrl: './info-dialog.component.html',
  standalone: true,
  imports: [TranslateCustomPipe, HsClipboardTextComponent, KeyValuePipe],
})
export class HsCompositionsInfoDialogComponent implements HsDialogComponent {
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
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsCompositionsService: HsCompositionsService,
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
