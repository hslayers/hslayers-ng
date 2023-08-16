import {HsConfig} from '../../config.service';
import {HsEventBusService} from './event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';

import {CustomTranslationService} from '../language/custom-translate.service';
import {HsLanguageService} from '../language/language.service';

@Injectable({
  providedIn: 'root',
})
export class HsCoreService {
  embeddedEnabled = true;
  config: any;
  _puremapApp = false;
  initCalled: boolean;
  missingLRFunctionsWarned: any;

  constructor(
    private hsLanguageService: HsLanguageService,
    public HsMapService: HsMapService,
    public hsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    private log: HsLogService,
    public HsEventBusService: HsEventBusService,
  ) {
    this.HsEventBusService.layoutLoads.subscribe(({element, innerElement}) => {
      // Initialization function for HSLayers elements and their sizes.
      // Stores element and container references and sets event listeners for map resizing.
      if (
        window.innerWidth < this.hsConfig.mobileBreakpoint ||
        this.hsConfig.sidebarClosed
      ) {
        this.HsLayoutService.sidebarExpanded = false;
        this.HsLayoutService.sidebarLabels = false;
      } else {
        this.HsLayoutService.sidebarExpanded = true;
      }
      const languages = this.hsConfig.enabledLanguages
        ? this.hsConfig.enabledLanguages.split(',').map((lang) => lang.trim())
        : ['cs', 'sk'];
      const translateService = this.hsLanguageService.getTranslator();
      translateService.addLangs(languages);
      translateService.setDefaultLang(`en`);

      const langToUse = this.getLangToUse(
        this.getDocumentLang(),
        translateService,
      );
      translateService.use(`${langToUse}`);
      this.hsLanguageService.language = langToUse;

      if (this.initCalled) {
        return;
      }
      this.HsMapService.loaded().then(() => {
        this.initSizeListeners();
        setTimeout(() => {
          this.updateMapSize();
        }, 750);
        this.initCalled = true;
      });
    });

    this.HsEventBusService.updateMapSize.subscribe(() => {
      this.updateMapSize();
    });
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
  private getLangToUse(
    documentLang: string,
    translateService: CustomTranslationService,
  ): string {
    const htmlLangInPath = document.location.pathname.includes(
      `/${documentLang}/`,
    );
    this.hsLanguageService.langFromCMS =
      htmlLangInPath && translateService.getLangs().includes(documentLang);
    return this.hsLanguageService.langFromCMS
      ? documentLang
      : this.hsConfig.language || translateService.getDefaultLang();
  }

  /**
   * Add event listeners for updating HS element and map size after browser resizing or complete load of application.
   * @public
   */
  initSizeListeners(): void {
    window.addEventListener('resize', () => {
      this.HsUtilsService.debounce(
        function () {
          this.updateMapSize();
          this.HsEventBusService.layoutResizes.next();
        },
        300,
        false,
        this,
      )();
    });
  }

  /**
   * Update map size.
   * @public
   */
  updateMapSize(): void {
    const map = this.HsMapService.mapElement;
    if (map === null) {
      return;
    }
    if (this.HsMapService.map) {
      this.HsMapService.map.updateSize();
      if (
        window.innerWidth < this.hsConfig.mobileBreakpoint ||
        this.HsLayoutService.mainpanel != ''
      ) {
        this.HsLayoutService.sidebarLabels = false;
      } else {
        this.HsLayoutService.sidebarLabels = true;
      }
    } else {
      this.log.log('Map not yet initialized!');
    }
    const neededSize = {
      width: map.offsetWidth,
      height: map.offsetHeight,
    };
    this.HsEventBusService.sizeChanges.next(neededSize);
  }

  /**
   * Do complete reset of map (view, layers) according to app config
   * @public
   */
  resetMap(): void {
    this.HsMapService.reset();
    this.HsEventBusService.mapResets.next();
  }

  /**
   * Whether app is running in puremapApp mode
   * @public
   */
  get puremapApp() {
    return this._puremapApp;
  }

  setPuremapApp(value) {
    this._puremapApp = value;
    if (value) {
      this.hsConfig.componentsEnabled.guiOverlay = false;
      this.HsMapService.removeAllInteractions();
      this.HsMapService.removeAllControls();
      this.HsLayoutService.updSidebarVisible(false);
    }
  }
}
