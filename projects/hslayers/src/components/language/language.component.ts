import {Component, OnInit} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsLanguageService} from './language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';
@Component({
  selector: 'hs-language',
  templateUrl: './partials/language.html',
})
export class HsLanguageComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  available_languages: any;
  name = 'language';
  constructor(
    public HsLanguageService: HsLanguageService,
    public hsConfig: HsConfig,
    HsLayoutService: HsLayoutService,
    public hsSidebarService: HsSidebarService
  ) {
    super(HsLayoutService);
  }

  ngOnInit(): void {
    this.hsSidebarService.addButton(
      {
        panel: 'language',
        module: 'hs.language',
        order: 13,
        fits: true,
        title: () =>
          this.HsLanguageService.getTranslation(
            'PANEL_HEADER.LANGUAGE',
            undefined,
            this.data.app
          ),
        description: () =>
          this.HsLanguageService.getTranslation(
            'SIDEBAR.descriptions.LANGUAGE',
            undefined,
            this.data.app
          ),
        content: () => {
          return this.HsLanguageService.getCurrentLanguageCode(
            this.data.app
          ).toUpperCase();
        },
      },
      this.data.app
    );
    this.available_languages = this.HsLanguageService.listAvailableLanguages(
      this.data.app
    );
    this.HsLanguageService.apps[this.data.app].language =
      this.hsConfig.get(this.data.app).language ?? 'en';
  }
  //$scope.$emit('scope_loaded', 'Language');
}
