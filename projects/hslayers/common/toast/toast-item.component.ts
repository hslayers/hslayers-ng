import {
  AfterContentInit,
  Component,
  EventEmitter,
  Output,
  computed,
  input,
  signal,
} from '@angular/core';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

/**
 * Represents an individual toast notification with customizable content,
 * appearance, and behavior.
 */
@Component({
  selector: 'hs-toast-item',
  standalone: true,
  template: `
    <div
      class="toast show d-flex align-items-center border-0"
      [class]="toastClass()"
      [class.toast-hidden]="isHiding()"
      role="alert"
      [style.maxHeight]="maxHeight()"
      (transitionend)="onTransitionEnd($event)"
    >
      <div class="toast-body position-relative gap-3">
        <div class="toast-icon">
          <i [class]="iconClass()" aria-hidden="true"></i>
        </div>
        <div class="toast-content">
          <strong class="me-auto">{{ header() }}</strong>
          <p class="mb-0 mt-2">{{ text() }}</p>
          @if (details()?.length) {
            <ul class="mt-2 mb-0 ps-3">
              @for (detail of details(); track detail) {
                <li>{{ detail }}</li>
              }
            </ul>
          }
        </div>
        <button
          type="button"
          class="btn-close position-absolute top-0 end-0 mt-2 me-2"
          aria-label="Close"
          (click)="hideToast()"
        ></button>
      </div>
    </div>
  `,
  styleUrls: ['./toast-item.component.scss'],
})
export class HsToastItemComponent implements AfterContentInit {
  /** Header text displayed at the top of the toast */
  readonly header = input<string>('');
  /** Main message text of the toast */
  readonly text = input<string>('');
  /** Optional array of detail messages shown as bullet points */
  readonly details = input<string[]>([]);
  /** Visual style of the toast (success, danger, warning, info) */
  readonly type = input<ToastType>('danger');
  /** Duration in milliseconds before the toast auto-hides */
  readonly delay = input<number>(5000);
  readonly autohide = input<boolean>(true);

  @Output() hidden = new EventEmitter<void>();

  private timeoutID: any;
  readonly isHiding = signal<boolean>(false);

  maxHeight = computed(() =>
    this.details()?.length > 0 ? `${this.details().length + 8}rem` : '8rem',
  );

  /** Computed CSS class based on toast type */
  toastClass = computed(() => `bg-${this.type()}`);

  /** Computed icon class based on toast type */
  iconClass = computed(() => {
    switch (this.type()) {
      case 'success':
        return 'fa-solid fa-square-check';
      case 'danger':
        return 'fa-solid fa-triangle-exclamation';
      case 'warning':
        return 'fa-solid fa-triangle-exclamation';
      case 'info':
        return 'fa-solid fa-circle-info';
      default:
        return '';
    }
  });

  ngAfterContentInit() {
    this.show();
  }

  /** Trigger the hiding animation */
  hideToast(): void {
    this.isHiding.set(true);
  }

  /** Handle transition end events for smooth hiding */
  onTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName === 'opacity' && this.isHiding()) {
      this.hide();
    }
  }

  /** Complete the hiding process and emit event */
  hide(): void {
    this.clearTimeout();
    this.hidden.emit();
  }

  /** Initialize the toast display state */
  private show(): void {
    this.isHiding.set(false);
    if (this.autohide()) {
      this.initTimeout();
    }
  }

  /** Set up auto-hide timer if enabled */
  private initTimeout() {
    if (this.autohide() && !this.timeoutID) {
      this.timeoutID = setTimeout(() => this.hideToast(), this.delay());
    }
  }

  /** Clean up auto-hide timer */
  private clearTimeout() {
    if (this.timeoutID) {
      clearTimeout(this.timeoutID);
      this.timeoutID = null;
    }
  }
}
