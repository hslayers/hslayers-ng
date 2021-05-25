import {HsLanguageService} from '../../language/language.service';
import {Injectable, TemplateRef} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class HsToastService {
  constructor(public HsLanguageService: HsLanguageService) {}
  toasts: any[] = [];
  /**
   * @param toast Toast pop up
   * Callback method to remove Toast DOM element from view
   */
  remove(toast): void {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }
  /**
   * @param textOrTpl Text or a template message to display
   * @param options Toast window options
   * Pushes new Toasts to array with content and options
   */
  show(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    if (this.toasts.length >= 5) {
      this.toasts = this.toasts.slice(-4);
    }
    this.toasts.push({textOrTpl, ...options});
  }
  /**
   * Creates new toast message with custom text and custom styling
   * @param header Header text to display
   * @param text Toast body text to display
   * @param disableLocalization Disable text translation
   * @param toastStyleClasses Toast message background and text style classes, for example - background: (bg-primary, bg-secondary, bg-success, bg-danger, bg-warning, bg-info, bg-light, bg-dark, bg-white)
   * and text: (text-primary, text-secondary, text-success, text-danger, text-warning, text-info, text-light, text-dark, text-white, text-muted)
   */
  createToastPopupMessage(
    header: string,
    text: string,
    disableLocalization?: boolean,
    toastStyleClasses?: string
  ): void {
    this.show(
      disableLocalization ? text : this.HsLanguageService.getTranslation(text),
      {
        header: disableLocalization
          ? header
          : this.HsLanguageService.getTranslation(header),
        delay: 7000,
        autohide: true,
        classname: toastStyleClasses || `bg-danger text-light`,
      }
    );
  }
}
