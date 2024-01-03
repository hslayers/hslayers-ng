import {Component, OnInit} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from './language.service';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsPanelBaseComponent} from 'hslayers-ng/components/layout';
import {HsSidebarService} from 'hslayers-ng/components/sidebar';

@Component({
  selector: 'hs-language',
  templateUrl: './language.component.html',
})
export class HsLanguageComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  available_languages: any;
  name = 'language';
  constructor(
    private hsLanguageService: HsLanguageService,
    private hsConfig: HsConfig,
    hsLayoutService: HsLayoutService,
    private hsSidebarService: HsSidebarService,
  ) {
    super(hsLayoutService);

    this.hsConfig.configChanges.subscribe(() => {
      if (this.hsConfig.additionalLanguages) {
        this.available_languages =
          this.hsLanguageService.listAvailableLanguages();
      }
    });
  }

  ngOnInit(): void {
    this.available_languages = this.hsLanguageService.listAvailableLanguages();
    super.ngOnInit();
  }

  /**
   * Check if provided language is active language
   * @param langCode - Language code
   * @returns True, if current language is active
   */
  isCurrentLang(langCode: string): boolean {
    return this.hsLanguageService.language?.endsWith(langCode.toLowerCase());
  }

  /**
   * Set UI language to provided one
   * @param langCode - Language code
   */
  setLanguage(langCode: string): void {
    this.hsLanguageService.setLanguage(langCode);
  }
}
