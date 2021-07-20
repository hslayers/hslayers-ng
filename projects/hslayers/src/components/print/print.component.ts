import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsPrintService} from './print.service';
@Component({
  selector: 'hs-print',
  templateUrl: './partials/printdialog.html',
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
   * @param {string} title Title of printed page
   */
  setTitle(title: string): void {
    this.title = title;
  }

  print(): void {
    this.HsPrintService.print(this.title);
  }
}
