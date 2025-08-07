import {Component, OnInit, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';

@Component({
  selector: 'hs-language',
  templateUrl: './language.component.html',
  standalone: false,
})
export class HsLanguageComponent
  extends HsPanelBaseComponent
  implements OnInit
{
  private hsLanguageService = inject(HsLanguageService);
  private hsConfig = inject(HsConfig);

  availableLanguages: any;
  name = 'language';

  constructor() {
    super();
    this.hsConfig.configChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.hsConfig.additionalLanguages) {
        this.availableLanguages =
          this.hsLanguageService.listAvailableLanguages();
      }
    });
  }

  ngOnInit(): void {
    this.availableLanguages = this.hsLanguageService.listAvailableLanguages();
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
