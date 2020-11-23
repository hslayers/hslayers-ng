import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsPrintService} from './print.service';
@Component({
  selector: 'hs-print',
  template: require('./partials/printdialog.html'),
})
export class HsPrintComponent {
  public title = '';

  constructor(
    public HsPrintService: HsPrintService,
    public HsConfig: HsConfig
  ) {
    //$scope.$emit('scope_loaded', 'Print');
  }

  /**
   * Set title of print
   *
   * @memberof hs.print.component
   * @function setTitle
   * @param {string} title Title of printed page
   */
  setTitle(title: string): void {
    this.title = title;
  }

  /**
   *
   * @memberof hs.print.component
   * @function print
   */
  print(): void {
    this.HsPrintService.print(this.title);
  }
}
