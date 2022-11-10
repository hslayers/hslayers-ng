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
  apps: {
    [id: string]: {toasts: Toast[]};
  } = {
    default: {
      toasts: [],
    },
  };

  get(app: string) {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = {
        toasts: [],
      };
    }
    return this.apps[app ?? 'default'];
  }

  constructor(
    public HsLanguageService: HsLanguageService,
    private HsLayoutService: HsLayoutService,
    private hsConfig: HsConfig
  ) {}
  /**
   * @param toast - Toast pop up
   * Callback method to remove Toast DOM element from view
   */
  remove(toast: Toast, app: string): void {
    const appRef = this.get(app);
    appRef.toasts = appRef.toasts.filter((t) => t !== toast);
  }

  removeByText(text: string, app: string): void {
    const found = this.get(app).toasts.filter((t) => t.textOrTpl === text);
    if (found?.length > 0) {
      for (const f of found) {
        this.remove(f, app);
      }
    }
  }
  /**
   * @param textOrTpl - Text or a template message to display
   * @param options - Toast window options
   * Pushes new Toasts to array with content and options
   */
  show(
    textOrTpl: string | TemplateRef<any>,
    app: string = 'default',
    options: any = {}
  ): void {
    const appRef = this.get(app);
    if (appRef.toasts.length >= 5) {
      appRef.toasts = appRef.toasts.slice(-4);
    }
    if (
      !appRef.toasts.some(
        (toast) =>
          toast.textOrTpl === textOrTpl &&
          toast?.serviceCalledFrom === options.serviceCalledFrom
      )
    ) {
      appRef.toasts.push({textOrTpl, ...options});
    }
  }
  /**
   * Creates new toast message with custom text and custom styling
   * @param header - Header text to display
   * @param text - Toast body text to display
   * @param options - Custom options for the toast message (disableLocalization: boolean, toastStyleClasses: string, customDelay: number, serviceCalledFrom: string)
   * @param app - Application id
   */

  createToastPopupMessage(
    header: string,
    text: string,
    options: customToastOptions = {},
    app: string = 'default'
  ): void {
    this.show(
      options.disableLocalization
        ? text
        : this.HsLanguageService.getTranslation(text, undefined, app),
      app,
      {
        header: options.disableLocalization
          ? header
          : this.HsLanguageService.getTranslation(header, undefined, app),
        delay:
          options.customDelay ||
          (this.hsConfig.get(app).errorToastDuration ?? 7000),
        autohide: true,
        classname: options.toastStyleClasses || `bg-danger text-light`,
        serviceCalledFrom: options.serviceCalledFrom,
        details: options.details || [],
      }
    );
  }

  shown(app: string) {
    //** Following hack is needed until ngBootstrap supports bootstrap5 fully */
    for (const toastElement of this.HsLayoutService.get(
      app
    ).contentWrapper.querySelectorAll('.toast-header .close')) {
      const classList = toastElement.classList;
      classList.add('btn-close');
      classList.remove('close');
    }
  }
}
