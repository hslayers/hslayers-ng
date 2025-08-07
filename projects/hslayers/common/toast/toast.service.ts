import {Injectable, TemplateRef, signal, inject} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {ToastType} from './toast-item.component';

export interface Toast {
  autohide?: boolean;
  type?: ToastType;
  delay?: number;
  details?: string[];
  header?: string;
  serviceCalledFrom?: string;
  textOrTpl?: string;
  id?: string;
}

export type customToastOptions = {
  /**
   * Disable text translation
   */
  disableLocalization?: boolean;
  /**
   * Type of toast message (success, danger, warning, info)
   */
  type?: ToastType;
  /**
   * Sets custom delay for the toast message
   */
  customDelay?: number;
  /**
   * Sets service name from where toast was called
   */
  serviceCalledFrom?: string;
  /**
   * Error details
   */
  details?: string[];
  /**
   * Whether the toast should automatically hide after delay
   */
  autohide?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class HsToastService {
  hsLanguageService = inject(HsLanguageService);
  private hsConfig = inject(HsConfig);

  private toastsSignal = signal<Toast[]>([]);

  get toasts() {
    return this.toastsSignal();
  }

  /**
   * Callback method to remove Toast DOM element from view
   * @param toast - Toast pop up
   */
  remove(toast: Toast): void {
    this.toastsSignal.update((toasts) => toasts.filter((t) => t !== toast));
  }

  removeByText(text: string): void {
    this.toastsSignal.update((toasts) =>
      toasts.filter((t) => t.textOrTpl !== text),
    );
  }

  /**
   * @param textOrTpl - Text or a template message to display
   * @param options - Toast window options
   * Pushes new Toasts to array with content and options
   */
  show(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    if (this.toasts.length >= 5) {
      this.toastsSignal.update((toasts) => toasts.slice(-4));
    }

    const newToast = {textOrTpl, ...options, id: crypto.randomUUID()};

    if (
      !this.toasts.some(
        (toast) =>
          toast.textOrTpl === textOrTpl &&
          toast?.serviceCalledFrom === options.serviceCalledFrom,
      )
    ) {
      this.toastsSignal.update((toasts) => [...toasts, newToast]);
    }
  }

  /**
   * Creates new toast message with custom text and custom styling
   * @param header - Header text to display
   * @param text - Toast body text to display
   * @param options - Custom options for the toast message (disableLocalization: boolean, toastStyleClasses: string, customDelay: number, serviceCalledFrom: string)
   */
  createToastPopupMessage(
    header: string,
    text: string,
    options: customToastOptions = {},
  ): void {
    this.show(
      options.disableLocalization
        ? text
        : this.hsLanguageService.getTranslation(text, undefined),
      {
        header: options.disableLocalization
          ? header
          : this.hsLanguageService.getTranslation(header, undefined),
        delay:
          options.customDelay || (this.hsConfig.errorToastDuration ?? 7000),
        autohide: true,
        type: options.type || 'danger',
        serviceCalledFrom: options.serviceCalledFrom,
        details:
          options.details?.map((detail) =>
            this.hsLanguageService.getTranslation(detail, undefined),
          ) || [],
      },
    );
  }
}
