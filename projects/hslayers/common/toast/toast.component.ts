import {Component, Input, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';

import {HsToastService} from './toast.service';
import {HsToastItemComponent} from './toast-item.component';
import {HsConfig} from 'hslayers-ng/config';

export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center';

@Component({
  selector: 'hs-toast',
  standalone: true,
  imports: [CommonModule, HsToastItemComponent],
  template: `
    @for (toast of hsToastService.toasts; track toast) {
      <hs-toast-item
        [header]="toast.header"
        [text]="toast.textOrTpl"
        [details]="toast.details"
        [type]="toast.type"
        [delay]="toast.delay"
        [autohide]="toast.autohide"
        (hidden)="hsToastService.remove(toast)"
      />
    }
  `,
  styleUrls: ['./toast.component.scss'],
  host: {
    '[class]': 'positionClasses()',
  },
})
export class HsToastComponent {
  @Input() position: ToastPosition = 'bottom-center';

  constructor(
    public hsToastService: HsToastService,
    private hsConfig: HsConfig,
  ) {}

  /**
   * Signal that tracks config changes
   */
  private configChanges = toSignal(this.hsConfig.configChanges, {
    initialValue: undefined,
  });

  /**
   * Computes the CSS classes for positioning the toast container
   * Combines position class with positioning based on anchor point
   * Recomputes when config is updated through configChanges
   */
  positionClasses = computed(() => {
    this.configChanges();
    const positionType =
      this.hsConfig.toastAnchor === 'screen'
        ? 'position-fixed'
        : 'position-absolute';
    return `${this.position} ${positionType}`;
  });
}
