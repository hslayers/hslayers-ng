import {Component, computed, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';

import {HsToastService} from './toast.service';
import {HsToastItemComponent} from './toast-item.component';
import {HsConfig, ToastPosition} from 'hslayers-ng/config';

@Component({
  selector: 'hs-toast',
  standalone: true,
  imports: [HsToastItemComponent],
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
  position = input<ToastPosition>('bottom-center');

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
    const containerPosition = this.position();
    const positionType =
      this.hsConfig.toastAnchor === 'screen'
        ? 'position-fixed'
        : 'position-absolute';
    return `${containerPosition} ${positionType}`;
  });
}
