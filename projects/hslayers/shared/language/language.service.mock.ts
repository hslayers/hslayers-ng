export function mockLanguageService() {
  return jasmine.createSpyObj('HsLanguageService', [
    'getTranslation',
    'getTranslationIgnoreNonExisting',
    'getTranslator',
    'setLanguage',
    'getCurrentLanguageCode',
    'listAvailableLanguages',
    'awaitTranslation',
  ]);
}
