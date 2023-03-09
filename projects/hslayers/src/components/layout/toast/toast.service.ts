import {Injectable, TemplateRef} from '@angular/core';

import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from './../layout.service';

export interface Toast {
  autohide?: boolean;
  classname?: string;
  delay?: number;
  details?: string[];
  header?: string;
  serviceCalledFrom?: string;
  textOrTpl?: string;
}

export type customToastOptions = {
  /**
   * Disable text translation
   */
  disableLocalization?: boolean;
  /**
   * Toast message background and text style classes, for example - background: (bg-primary, bg-secondary, bg-success, bg-danger, bg-warning, bg-info, bg-light, bg-dark, bg-white)
   * and text: (text-primary, text-secondary, text-success, text-danger, text-warning, text-info, text-light, text-dark, text-white, text-muted)
   */
  toastStyleClasses?: string;
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
};

@Injectable({
  providedIn: 'root',
})
export class HsToastService {
  toasts: Toast[];
  constructor(
    public HsLanguageService: HsLanguageService,
    private HsLayoutService: HsLayoutService,
    private hsConfig: HsConfig
  ) {}
  /**
   * @param toast - Toast pop up
   * Callback method to remove Toast DOM element from view
   */
  remove(toast: Toast): void {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }

  removeByText(text: string): void {
    const found = this.toasts.filter((t) => t.textOrTpl === text);
    if (found?.length > 0) {
      for (const f of found) {
        this.remove(f);
      }
    }
  }
  /**
   * @param textOrTpl - Text or a template message to display
   * @param options - Toast window options
   * Pushes new Toasts to array with content and options
   */
  show(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    if (this.toasts.length >= 5) {
      this.toasts = this.toasts.slice(-4);
    }
    if (
      !this.toasts.some(
        (toast) =>
          toast.textOrTpl === textOrTpl &&
          toast?.serviceCalledFrom === options.serviceCalledFrom
      )
    ) {
      this.toasts.push({textOrTpl, ...options});
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
    options: customToastOptions = {}
  ): void {
    this.show(
      options.disableLocalization
        ? text
        : this.HsLanguageService.getTranslation(text, undefined),
      {
        header: options.disableLocalization
          ? header
          : this.HsLanguageService.getTranslation(header, undefined),
        delay:
          options.customDelay || (this.hsConfig.errorToastDuration ?? 7000),
        autohide: true,
        classname: options.toastStyleClasses || `bg-danger text-light`,
        serviceCalledFrom: options.serviceCalledFrom,
        details: options.details || [],
      }
    );
  }

  shown() {
    //** Following hack is needed until ngBootstrap supports bootstrap5 fully */
    for (const toastElement of this.HsLayoutService.contentWrapper.querySelectorAll(
      '.toast-header .close'
    )) {
      const classList = toastElement.classList;
      classList.add('btn-close');
      classList.remove('close');
    }
  }
}
