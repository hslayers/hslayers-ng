import {Component, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

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
  ) {
    super();

    this.hsConfig.configChanges.pipe(takeUntilDestroyed()).subscribe(() => {
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
