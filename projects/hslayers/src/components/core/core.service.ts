import {HsConfig} from '../../config.service';
import {HsEventBusService} from './event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';

import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class HsCoreService {
  /**
   * @ngdoc property
   * @name HsCore#scopes_registered
   * @public
   * @type {Array}
   * @description DEPRECATED?
   */
  embededEnabled = true;
  /**
   * @ngdoc property
   * @name HsCore#_exist_cache
   * @public
   * @type {object}
   * @description DEPRECATED?
   */
  _exist_cache: any = {};

  language = 'en';
  config: any;
  _puremapApp = false;
  initCalled: boolean;
  missingLRFunctionsWarned: any;
  singleDatasourcesWarningShown: boolean;
  existsWarningShown: any;

  constructor(
    public HsMapService: HsMapService,
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    private log: HsLogService,
    public HsEventBusService: HsEventBusService,
    private translate: TranslateService
  ) {
    /**
     * @ngdoc property
     * @name HsCore#config
     * @public
     * @type {object}
     * @description Service shortcut to config module defined by app.js for application
     */
    this.config = this.HsConfig;
    if (window.innerWidth < 767 || this.HsConfig.sidebarClosed) {
      this.HsLayoutService.sidebarExpanded = false;
      this.HsLayoutService.sidebarLabels = false;
    } else {
      this.HsLayoutService.sidebarExpanded = true;
    }

    this.translate.addLangs(['en', 'cs', 'lv']);
    this.translate.setDefaultLang('en');
    if (this.HsConfig.language) {
      this.translate.use(this.HsConfig.language);
    }
    this.HsEventBusService.layoutLoads.subscribe(({element, innerElement}) => {
      this.init();
    });
  }

  //TODO: element, options not used anymore
  /**
   * @ngdoc method
   * @name HsCore#init
   * @public
   * @param {object} element HS layers element gained from directive link
   * @param {object} options Optional options object when HS app has not CSS sizes declared. Parent property is Boolean type when size should be taken from HS element parent. Element property is string for any css like selector
   * @description Initialization function for HS layers elements and their sizes. Stores element and container references and sets event listeners for map resizing.
   */
  init(): void {
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
  }
  /**
   * @ngdoc method
   * @name HsCore#updateVH
   * @private
   * @description Define and change size of CSS custom variable --vh used as reference for hs.app-height
   */
  updateVH() {
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
   * @ngdoc method
   * @name HsCore#initSizeListeners
   * @public
   * @description Add event listeners for updating HS element and map size after browser resizing or complete load of application.
   */
  initSizeListeners(): void {
    window.addEventListener('resize', () => {
      this.HsUtilsService.debounce(
        function () {
          this.updateVH();
          this.updateMapSize();
        },
        300,
        false,
        this
      )();
    });
  }
  /**
   * @ngdoc method
   * @name HsCore#updateMapSize
   * @public
   * @description Update map size.
   */
  updateMapSize(): void {
    const map = this.HsLayoutService.contentWrapper.querySelector('.hs-ol-map');
    const mapSpace = this.HsLayoutService.contentWrapper.querySelector('.hs-map-space');
    if (map === null) {
      return;
    }
    if (this.HsMapService.map) {
      //Next line is needed on safari because height: 100% doesn't work good there.
      map.style.minHeight = `${mapSpace.offsetHeight}px`;
      this.HsMapService.map.updateSize();
      if (window.innerWidth < 767 || this.HsLayoutService.mainpanel != '') {
        this.HsLayoutService.smallWidth = true; //deprecated?
        this.HsLayoutService.sidebarLabels = false;
      } else {
        this.HsLayoutService.smallWidth = false; //deprecated?
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
   * @ngdoc method
   * @name HsCore#isAuthorized
   * @public
   * @returns {boolean} Check result - true for authorized user
   * @description Do authorization check of User, currently authorization is possible only in connection with Lifearray app
   */
  isAuthorized(): boolean {
    if (window['getLRUser'] === undefined && !this.missingLRFunctionsWarned) {
      this.log.warn(
        'window.getLRUser function needs to be defined, which usually comes from liferay.'
      );
      this.missingLRFunctionsWarned = true;
    }
    if (window['getLRUser'] && window['getLRUser']() != 'guest') {
      return true;
    }
    return false;
  }

  /**
   * @ngdoc method
   * @name HsCore#resetMap
   * @public
   * @description Do complete reset of map (view, layers) according to app config
   */
  resetMap(): void {
    this.HsMapService.reset();
    /**
     * @ngdoc event
     * @name HsCore#core.map_reset
     * @eventType broadcast on $rootScope
     * @description Fires when map completely reset
     */
    this.HsEventBusService.mapResets.next();
    //$rootScope.$broadcast('core.map_reset', {});
  }

  /**
   * @ngdoc method
   * @name HsCore#isMobile
   * @public
   * @returns {string} Returns "mobile" or ""
   * @description Test if screen of used device is mobile type (current breakdown is screen width 800px)
   */
  isMobile(): string {
    if (window['cordova']) {
      return 'mobile';
    } else {
      return '';
    }
  }

  /**
   * @ngdoc property
   * @name HsCore#puremapApp
   * @public
   * @type {boolean} false
   * @description If app is running in puremapApp mode
   */
  get puremapApp() {
    return this._puremapApp;
  }

  set puremapApp(value) {
    this._puremapApp = value;
    if (value) {
      this.HsLayoutService.createComponentsEnabledConfigIfNeeded();
      this.HsConfig.componentsEnabled.toolbar = false;
      this.HsConfig.componentsEnabled.sidebar = false;
      this.HsConfig.componentsEnabled.geolocationButton = false;
      this.HsMapService.removeAllInteractions();
      this.HsMapService.removeAllControls();
      this.HsLayoutService.sidebarVisible(false);
    }
  }
}
