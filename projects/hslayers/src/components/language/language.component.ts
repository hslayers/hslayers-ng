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
  implements OnInit {
  available_languages: any;
  name = 'language';
  constructor(
    private hsLanguageService: HsLanguageService,
    private hsConfig: HsConfig,
    hsLayoutService: HsLayoutService,
    private hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
  }

  ngOnInit(): void {
    const app = this.data.app;
    this.hsSidebarService.addButton(
      {
        panel: 'language',
        module: 'hs.language',
        order: 13,
        fits: true,
        title: () =>
          this.hsLanguageService.getTranslation(
            'PANEL_HEADER.LANGUAGE',
            undefined,
            app
          ),
        description: () =>
          this.hsLanguageService.getTranslation(
            'SIDEBAR.descriptions.LANGUAGE',
            undefined,
            app
          ),
        content: () => {
          return this.hsLanguageService
            .getCurrentLanguageCode(app)
            .toUpperCase();
        },
      },
      app
    );
    this.available_languages =
      this.hsLanguageService.listAvailableLanguages(app);
    const configLang = this.hsConfig.get(app).language;
    if (configLang != undefined) {
      this.setLanguage(configLang);
    }
  }

  /**
   * Check if provided language is active language
   * @param langCode - Language code
   * @returns True, if current language is active
   */
  isCurrentLang(langCode: string): boolean {
    return this.hsLanguageService.apps[this.data.app]?.language.endsWith(
      langCode.toLowerCase()
    );
  }

  /**
   * Set UI language to provided one
   * @param langCode - Language code
   */
  setLanguage(langCode: string): void {
    this.hsLanguageService.setLanguage(langCode, this.data.app);
  }
}
