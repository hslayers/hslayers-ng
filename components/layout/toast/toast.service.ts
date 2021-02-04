import {Injectable, TemplateRef} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsToastService {
  toasts: any[] = [];
  /**
   * @ngdoc method
   * @name PmToastService#remove
   * @public
   * @param {any} toast Toast pop up
   * @description Callback method to remove Toast DOM element from view
   */
  remove(toast): void {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }
  /**
   * @ngdoc method
   * @name PmToastService#show
   * @public
   * @param {string | TemplateRef<any>} textOrTpl Text or a template message to display
   * @param {any} options Toast window options
   * @description Pushes new Toasts to array with content and options
   */
  show(textOrTpl: string | TemplateRef<any>, options: any = {}): void {
    this.toasts.push({textOrTpl, ...options});
  }
}