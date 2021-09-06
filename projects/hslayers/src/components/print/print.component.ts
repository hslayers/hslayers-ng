import {Component} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsPrintService} from './print.service';
@Component({
  selector: 'hs-print',
  templateUrl: './partials/printdialog.html',
})
export class HsPrintComponent extends HsPanelBaseComponent {
  public title = '';
  name = 'print';

  constructor(
    public HsPrintService: HsPrintService,
    public HsConfig: HsConfig,
    HsLayoutService: HsLayoutService
  ) {
    super(HsLayoutService);
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
