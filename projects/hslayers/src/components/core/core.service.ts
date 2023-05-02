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
    private hsLanguageService: HsLanguageService,
    public HsMapService: HsMapService,
    public hsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    private log: HsLogService,
    public HsEventBusService: HsEventBusService
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
        : ['cs', 'lv'];
      const translateService = this.hsLanguageService.getTranslator();
      translateService.addLangs(languages);
      translateService.setDefaultLang(`en`);
      if (this.hsConfig.language) {
        translateService.use(`${this.hsConfig.language}`);
        this.hsLanguageService.language = this.hsConfig.language;
      } else {
        translateService.use(translateService.getDefaultLang());
      }

      if (this.initCalled) {
        return;
      }
      this.HsMapService.loaded().then(() => {
        this.initSizeListeners();
        setTimeout(() => {
          this.updateVH();
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
  initSizeListeners(): void {
    window.addEventListener('resize', () => {
      this.HsUtilsService.debounce(
        function () {
          this.updateVH();
          this.updateMapSize();
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
        this.HsLayoutService.smallWidth = true; //deprecated
        this.HsLayoutService.sidebarLabels = false;
      } else {
        this.HsLayoutService.smallWidth = false; //deprecated
        this.HsLayoutService.sidebarLabels = true;
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
   * FIXME: statusmanager
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
  resetMap(): void {
    this.HsMapService.reset();
    this.HsEventBusService.mapResets.next();
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
