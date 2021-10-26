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
    hsSidebarService: HsSidebarService
  ) {
    super(HsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'language',
      module: 'hs.language',
      order: 13,
      fits: true,
      title: () =>
        this.HsLanguageService.getTranslation('PANEL_HEADER.LANGUAGE'),
      description: () =>
        this.HsLanguageService.getTranslation('SIDEBAR.descriptions.LANGUAGE'),
      content: () => {
        return this.HsLanguageService.getCurrentLanguageCode().toUpperCase();
      },
    });
  }

  ngOnInit(): void {
    this.available_languages = this.HsLanguageService.listAvailableLanguages();
    this.HsLanguageService.language = this.hsConfig.language ?? 'en';
  }
  //$scope.$emit('scope_loaded', 'Language');
}
