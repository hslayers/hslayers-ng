import {HsConfig} from '../../config.service';
import {HsEventBusService} from './event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';

import {HsLanguageService} from '../language/language.service';

@Injectable({
  providedIn: 'root',
})
export class HsCoreService {
  /**
   * @public
   */
  embeddedEnabled = true;
  language = 'en';
  config: any;
  _puremapApp = false;
  initCalled: boolean;
  missingLRFunctionsWarned: any;

  constructor(
    public HsMapService: HsMapService,
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    private log: HsLogService,
    public HsEventBusService: HsEventBusService,
    private hsLanguageService: HsLanguageService
  ) {
    this.HsEventBusService.layoutLoads.subscribe(
      ({element, innerElement, app}) => {
        if (!this.initCalled) {
          this.init(app);
        }
      }
    );

    this.HsEventBusService.updateMapSize.subscribe((app) => {
      this.updateMapSize(app);
    });
  }

  /**
   * Initialization function for HSLayers elements and their sizes.
   * Stores element and container references and sets event listeners for map resizing.
   * @public
   */
  init(app: string): void {
    const config = this.HsConfig.get(app);
    if (window.innerWidth < config.mobileBreakpoint || config.sidebarClosed) {
      this.HsLayoutService.get(app).sidebarExpanded = false;
      this.HsLayoutService.get(app).sidebarLabels = false;
    } else {
      this.HsLayoutService.get(app).sidebarExpanded = true;
    }
    const languages = config.enabledLanguages
      ? config.enabledLanguages.split(',').map((lang) => lang.trim())
      : ['cs', 'lv'];
    const translateService = this.hsLanguageService.getTranslator(app);
    translateService.addLangs(languages.map((l) => `${app}|${l}`));
    translateService.setDefaultLang(`${app}|en`);
    if (config.language) {
      this.hsLanguageService.setLanguage(config.language, app);
    } else {
      translateService.use(translateService.getDefaultLang());
    }

    if (this.initCalled) {
      return;
    }
    this.HsMapService.loaded(app).then(() => {
      this.initSizeListeners(app);
      setTimeout(() => {
        this.updateVH();
        this.updateMapSize(app);
      }, 750);
      this.initCalled = true;
    });
  }
  /**
   * Define and change size of CSS custom variable --vh used as reference for hs.app-height
   * @private
   */
  private updateVH() {
    if (this.HsUtilsService.runningInBrowser()) {
      const vh = window.innerHeight * 0.01;
      document.body.style.setProperty('--vh', `${vh}px`);

      if (window.matchMedia('(orientation: portrait)').matches) {
        document.getElementsByTagName('html')[0].style.height = '100vh';
        setTimeout(() => {
          document.getElementsByTagName('html')[0].style.height = '100%';
        }, 500);
      }
    }
  }
  /**
   * Add event listeners for updating HS element and map size after browser resizing or complete load of application.
   * @public
   */
  initSizeListeners(app: string): void {
    window.addEventListener('resize', () => {
      this.HsUtilsService.debounce(
        function () {
          this.updateVH();
          this.updateMapSize(app);
          this.HsEventBusService.layoutResizes.next();
        },
        300,
        false,
        this
      )();
    });
  }

  /**
   * Update map size.
   * @public
   */
  updateMapSize(app: string): void {
    const map = this.HsMapService.apps[app].mapElement;
    if (map === null) {
      return;
    }
    if (this.HsMapService.getMap(app)) {
      this.HsMapService.getMap(app).updateSize();
      if (
        window.innerWidth < this.HsConfig.get(app).mobileBreakpoint ||
        this.HsLayoutService.get(app).mainpanel != ''
      ) {
        this.HsLayoutService.get(app).smallWidth = true; //deprecated
        this.HsLayoutService.get(app).sidebarLabels = false;
      } else {
        this.HsLayoutService.get(app).smallWidth = false; //deprecated
        this.HsLayoutService.get(app).sidebarLabels = true;
      }
    } else {
      console.log('Map not yet initialized!');
    }
    const neededSize = {
      width: map.offsetWidth,
      height: map.offsetHeight,
    };
    this.HsEventBusService.sizeChanges.next(neededSize);
  }

  /**
   * Do authorization check of User, currently authorization is possible only in connection with Liferay app
   * @public
   * @returns Check result - true for authorized user
   */
  isAuthorized(): boolean {
    if (window['getLRUser'] === undefined && !this.missingLRFunctionsWarned) {
      this.log.warn(
        'window.getLRUser function needs to be defined, which usually comes from Liferay.'
      );
      this.missingLRFunctionsWarned = true;
    }
    if (window['getLRUser'] && window['getLRUser']() != 'guest') {
      return true;
    }
    return false;
  }

  /**
   * Do complete reset of map (view, layers) according to app config
   * @public
   */
  resetMap(app: string): void {
    this.HsMapService.reset(app);
    this.HsEventBusService.mapResets.next({app});
  }

  /**
   * Tests if screen of used device is mobile type (current breakdown is screen width 800px)
   * @public
   * @returns "mobile" or ""
   */
  isMobile(): string {
    if (window['cordova']) {
      return 'mobile';
    } else {
      return '';
    }
  }

  /**
   * Whether app is running in puremapApp mode
   * @public
   */
  get puremapApp() {
    return this._puremapApp;
  }

  setPuremapApp(value, app: string) {
    this._puremapApp = value;
    if (value) {
      this.HsConfig.get(app).componentsEnabled.guiOverlay = false;
      this.HsMapService.removeAllInteractions(app);
      this.HsMapService.removeAllControls(app);
      this.HsLayoutService.updSidebarVisible(app, false);
    }
  }
}
