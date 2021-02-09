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
    this.toasts.push({textOrTpl, ...options});
  }
  /**
   * @param header Header text to display
   * @param text Toast body text to display
   * @param backgroundType Toast message background type (primary, secondary, success, danger, warning, info, light, dark, white)
   */
  createToastPopupMessage(
    header: string,
    text: string,
    backgroundType: string
  ): void {
    this.show(this.HsLanguageService.getTranslation(text), {
      header: this.HsLanguageService.getTranslation(header),
      delay: 3000,
      autohide: true,
      classname: `bg-${backgroundType} text-light`,
    });
  }
}
