import {Injectable} from '@angular/core';
import {lastValueFrom} from 'rxjs';

import {
  CustomTranslationService,
  WebpackTranslateLoader,
} from './custom-translate.service';
import {HsConfig} from 'hslayers-ng/config';
import {HsLogService} from 'hslayers-ng/services/log';

const DEFAULT_LANG = 'en' as const;

@Injectable({
  providedIn: 'root',
})
export class HsLanguageService {
  /**
   * ISO 639-1 code of current language
   */
  language: string;
  /**
   * Controls whether hs-lang URL param should override other setting or not
   * Not in case we are syncing langs with Wagtail
   */
  langFromCMS: boolean;

  constructor(
    private translationService: CustomTranslationService,
    private hsConfig: HsConfig,
    private hsLog: HsLogService,
  ) {
    this.hsConfig.configChanges.subscribe(() => {
      const translator = this.translationService;
      if (!translator.defaultLang) {
        // When config fetched via initializer service this gets in front of core service init method
        this.initLanguages();
      }
      if (this.hsConfig.enabledLanguages) {
        const langs = this.hsConfig.enabledLanguages.split(',');
        const langsToAdd = langs.filter(
          (l) => !translator.getLangs().includes(l),
        );
        translator.addLangs(langsToAdd);
      }
      if (this.hsConfig.language) {
        this.setLanguage(this.hsConfig.language);
      }
      const currentLoader = translator.currentLoader as WebpackTranslateLoader;
      if (
        this.hsConfig.translationOverrides != undefined &&
        !currentLoader.loadedViaInitializator.includes(translator.currentLang)
      ) {
        if (translator?.currentLang) {
          translator.reloadLang(translator.currentLang);
        }
      }
    });
  }

  /**
   * Set up languages - default, list of allowed, the one to use
   */
  initLanguages() {
    const languages = this.hsConfig.enabledLanguages
      ? this.hsConfig.enabledLanguages.split(',').map((lang) => lang.trim())
      : ['en,', 'cs', 'sk'];
    this.translationService.addLangs(languages);
    this.translationService.setDefaultLang('en');
    const langToUse = this.getLangToUse();
    this.setLanguage(langToUse);
  }

  /**
   * Set language
   * @public
   * @param lang - Language code
   */
  setLanguage(lang: string, retryCount = 0): void {
    this.getTranslator().use(lang);
    if (this.getTranslator().currentLang !== lang) {
      if (retryCount < 5) {
        this.hsLog.warn(
          `Setting language to: ${lang} failed. Retrying (${
            retryCount + 1
          }/5) after a short while.`,
        );
        setTimeout(() => {
          this.setLanguage(lang, retryCount + 1); // Increase retry count
        }, 500);
      } else {
        this.hsLog.error(
          `Setting language to: ${lang} failed after 5 attempts.`,
        );
      }
    }
    this.language = lang;
  }

  getTranslator(): CustomTranslationService {
    return this.translationService;
  }

  /**
   * Get code of current language
   * @public
   * @returns Language code
   */
  getCurrentLanguageCode(): string {
    if (typeof this.language == 'undefined' || this.language == '') {
      return DEFAULT_LANG;
    }
    return this.language.toLowerCase();
  }

  /**
   * Get array of available languages based
   * @returns Available languages
   */
  listAvailableLanguages() {
    const additionalLanguages = this.hsConfig.additionalLanguages;
    const languageCodeNameMap = {
      'en': 'English',
      'cs': 'Česky',
      'fr': 'Français',
      'lv': 'Latviski',
      'nl': 'Nederlands',
      'sk': 'Slovensky',
      ...additionalLanguages,
    };
    const langs = [{key: 'en', name: 'English'}];
    for (const lang of this.translationService.getLangs()) {
      if (
        languageCodeNameMap.hasOwnProperty(lang) &&
        langs.filter((l) => l.key == lang).length == 0
      ) {
        langs.push({key: lang, name: languageCodeNameMap[lang]});
      }
    }
    return langs;
  }

  /**
   * @param str - Identifier of the string to be translated
   * @param params - Dynamic params included in the translation
   * @returns Translation
   */
  getTranslation(str: string, params?: any): string {
    return this.translationService.instant(str, params);
  }

  /**
   * Async variant of getTranslation function for translations which might
   * be needed immediately after application init before locales are even loaded
   */
  async awaitTranslation(str: string, params?: any): Promise<string> {
    const translator = this.translationService;
    const lang = translator.currentLang;
    const MAX_CONFIG_POLLS = 10;
    let counter = 0;
    while (
      !(translator.currentLoader as WebpackTranslateLoader).loadedLanguages()[
        lang
      ] &&
      counter++ < MAX_CONFIG_POLLS
    ) {
      await new Promise((resolve2) => setTimeout(resolve2, 500));
    }
    const value = await lastValueFrom(translator.get(str, params));
    return value;
  }

  /**
   * @param module - Module to look for inside the locales json
   * @param text - Text that represents the translation
   * @param params - Dynamic params included in the translation, for example,
   * "translation": "This is my \{\{nr\}\} translation" - params: \{nr: 'first'\}
   * @returns Translation
   */

  getTranslationIgnoreNonExisting(
    module: string,
    text: string,
    params?: any,
  ): string {
    const tmp = this.getTranslation(module + '.' + text, params || undefined);
    if (tmp.includes(module + '.')) {
      return text;
    }
    return tmp;
  }

  /**
   * Parse language code from HTML lang attr
   * Takes only first part of lang definition in case 'en-us' format is used
   */
  private getDocumentLang(): string {
    let documentLang = document.documentElement?.lang;
    return (documentLang = documentLang.includes('-')
      ? documentLang.split('-')[0]
      : documentLang);
  }

  /**
   * If possible sync language with HTML document lang attribute
   * otherwise use lang used in config or default (en)
   */
  private getLangToUse(): string {
    const documentLang = this.getDocumentLang();
    const htmlLangInPath = document.location.pathname.includes(
      `/${documentLang}/`,
    );
    this.langFromCMS =
      htmlLangInPath &&
      this.translationService.getLangs().includes(documentLang);
    return this.langFromCMS
      ? documentLang
      : this.hsConfig.language || this.translationService.getDefaultLang();
  }
}
