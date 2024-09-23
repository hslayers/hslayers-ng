import {Component, inject, input} from '@angular/core';

import {HsToastService} from 'hslayers-ng/common/toast';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-clipboard-text',
  standalone: true,
  imports: [TranslateCustomPipe],
  template: `
    @if (anchor()) {
      <a class="flex-fill text-truncate" href="text()">{{ text() }}</a>
    } @else {
      <span class="flex-fill text-truncate">{{ text() }}</span>
    }
    <button
      class="btn btn-sm text-secondary"
      data-toggle="tooltip"
      [title]="'COMMON.copyToClipboard' | translateHs"
      (click)="copyToClipBoard()"
    >
      <i [class.icon-check]="showCheck" [class.icon-copy]="!showCheck"></i>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      width: 100%;
    }
  `,
})
export class HsClipboardTextComponent {
  text = input.required<string>();
  anchor = input<boolean>(false);

  hsToastService = inject(HsToastService);
  showCheck = false;

  copyToClipBoard() {
    if (!navigator.clipboard) {
      this.hsToastService.createToastPopupMessage(
        'COMMON.copyToClipboard',
        'COMMON.copyToClipboardFailure',
        {
          toastStyleClasses: 'bg-danger text-white',
        },
      );
      return;
    }
    this.showCheck = true;
    navigator.clipboard.writeText(this.text());
    setTimeout(() => {
      this.showCheck = false;
    }, 500);
  }
}
