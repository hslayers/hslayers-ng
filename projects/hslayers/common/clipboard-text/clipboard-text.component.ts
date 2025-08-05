import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {HsToastService} from 'hslayers-ng/common/toast';

@Component({
  selector: 'hs-clipboard-text',
  imports: [TranslatePipe],
  template: `
    @if (anchor()) {
      <a class="flex-fill text-truncate" href="text()">{{ text() }}</a>
    } @else {
      <span class="flex-fill text-truncate">{{ text() }}</span>
    }
    <button
      class="btn btn-sm text-secondary"
      data-toggle="tooltip"
      [title]="'COMMON.copyToClipboard' | translate"
      (click)="copyToClipBoard()"
    >
      <i
        class="fa-solid"
        [class.fa-square-check]="showCheck()"
        [class.fa-copy]="!showCheck()"
        [class.text-success]="showCheck()"
      ></i>
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsClipboardTextComponent {
  text = input.required<string>();
  anchor = input<boolean>(false);

  hsToastService = inject(HsToastService);
  showCheck = signal(false);

  copyToClipBoard() {
    if (!navigator.clipboard) {
      this.hsToastService.createToastPopupMessage(
        'COMMON.copyToClipboard',
        'COMMON.copyToClipboardFailure',
        {
          type: 'danger',
        },
      );
      return;
    }
    this.showCheck.set(true);
    navigator.clipboard.writeText(this.text());
    setTimeout(() => {
      this.showCheck.set(false);
    }, 1000);
  }
}
