import { Component, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { HsPrintService } from './print.service';
import { HsConfig } from '../../config.service';
@Component({
  selector: 'hs.print',
  template: require('./partials/printdialog.html')
})
export class HsPrintComponent {
  public title: string = '';

  constructor(private HsPrintService: HsPrintService, private HsConfig: HsConfig) {
    //$scope.$emit('scope_loaded', 'Print');
  }

  /**
  * Set title of print
  *
  * @memberof hs.print.component
  * @function setTitle
  * @param {string} title Title of printed page
  */
  setTitle(title: string) {
    this.title = title;
  }

  /**
   *
   * @memberof hs.print.component
   * @function print
   */
  print() {
    this.HsPrintService.print(this.title);
  }
}