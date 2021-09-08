import {Component} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsPrintService} from './print.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
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
    HsLayoutService: HsLayoutService,
    hsLanguageService: HsLanguageService,
    hsSidebarService: HsSidebarService
  ) {
    super(HsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'print',
      module: 'hs.print',
      order: 10,
      fits: true,
      title: () => hsLanguageService.getTranslation('PANEL_HEADER.PRINT'),
      description: () =>
        hsLanguageService.getTranslation('SIDEBAR.descriptions.PRINT'),
      icon: 'icon-print',
    });
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
