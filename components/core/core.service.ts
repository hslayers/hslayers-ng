import {DOCUMENT} from '@angular/common';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from './event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Inject, Injectable} from '@angular/core';

import {TranslateService} from '../../node_modules/@ngx-translate/core';
import {TranslateStore} from '../../node_modules/@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class HsCoreService {
  hslayersNgTemplate: string = require('../../hslayers.html');
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
    private HsMapService: HsMapService,
    private HsConfig: HsConfig,
    private HsLayoutService: HsLayoutService,
    private HsUtilsService: HsUtilsService,
    private window: Window,
    private log: HsLogService,
    @Inject(DOCUMENT) private document: Document,
    private HsEventBusService: HsEventBusService,
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
    if (this.window.innerWidth < 767 || this.HsConfig.sidebarClosed) {
      this.HsLayoutService.sidebarExpanded = false;
      this.HsLayoutService.sidebarLabels = false;
    } else {
      this.HsLayoutService.sidebarExpanded = true;
    }

    this.translate.addLangs(['en', 'cz']);
    console.log(this.translate);
    this.translate.setDefaultLang('en');
    if (this.HsConfig.language) {
      this.translate.use(this.HsConfig.language);
    }
  }

  /**
   * @deprecated Replaced by HsLayoutService#setMainPanel
   * @param which
   * @param by_gui
   */
  setMainPanel(which, by_gui): void {
    this.log.warn(
      'setMainPanel will be removed from HsCore in future. Use HsLayoutService#setMainPanel method instead'
    );
    this.HsLayoutService.setMainPanel(which, by_gui);
  }

  /**
   * @deprecated Replaced by HsLayoutService#setDefaultPanel
   * @param which
   */
  setDefaultPanel(which) {
    this.log.warn(
      'setDefaultPanel will be removed from HsCore in future. Use HsLayoutService#setDefaultPanel method instead'
    );
    return this.HsLayoutService.setDefaultPanel(which);
  }

  /**
   * @deprecated Replaced by HsLayoutService#panelVisible
   * @param {*} which
   * @param {*} scope
   */
  panelVisible(which, scope) {
    this.log.warn(
      'panelVisible will be removed from HsCore in future. Use HsLayoutService#panelVisible method instead'
    );
    return this.HsLayoutService.panelVisible(which, scope);
  }

  /**
   * @deprecated Replaced by HsLayoutService#panelEnabled
   * @param {*} which
   * @param {*} status
   */
  panelEnabled(which, status) {
    this.log.warn(
      'panelEnabled will be removed from HsCore in future. Use HsLayoutService#panelEnabled method instead'
    );
    return this.HsLayoutService.panelEnabled(which, status);
  }

  /**
   * @deprecated Replaced by HsLayoutService#closePanel
   * @param {*} which
   * @memberof HsCoreService
   */
  closePanel(which) {
    this.log.warn(
      'closePanel will be removed from HsCore in future. Use HsLayoutService#closePanel method instead'
    );
    return this.HsLayoutService.closePanel(which);
  }
  /**
   * @deprecated Replaced by config.allowAddExternalDatasets
   */
  get singleDatasources() {
    return this.HsConfig.allowAddExternalDatasets;
  }

  /**
   * @deprecated Replaced by config.allowAddExternalDatasets
   */
  set singleDatasources(newName) {
    if (!this.singleDatasourcesWarningShown) {
      this.singleDatasourcesWarningShown = true;
      this.log.warn(
        'singleDatasources will be removed from HsCore in future. Use config.allowAddExternalDatasets instead or hide datasource_selector panel using config.panelsEnabled object'
      );
    }
    this.HsConfig.allowAddExternalDatasets = newName;
  }

  /**
   * @ngdoc method
   * @name HsCore#init
   * @public
   * @param {object} element HS layers element gained from directive link
   * @param {object} options Optional options object when HS app has not CSS sizes declared. Parent property is Boolean type when size should be taken from HS element parent. Element property is string for any css like selector
   * @description Initialization function for HS layers elements and their sizes. Stores element and container references and sets event listeners for map resizing.
   */
  init(element, options?): void {
    if (this.initCalled) {
      return;
    }
    this.HsMapService.loaded().then((map) => {
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
    const vh = this.window.innerHeight * 0.01;
    this.document.body.style.setProperty('--vh', `${vh}px`);

    if (this.window.matchMedia('(orientation: portrait)').matches) {
      this.document.getElementsByTagName('html')[0].style.height = '100vh';
      setTimeout(() => {
        this.document.getElementsByTagName('html')[0].style.height = '100%';
      }, 500);
    }
  }
  /**
   * @ngdoc method
   * @name HsCore#initSizeListeners
   * @public
   * @description Add event listeners for updating HS element and map size after browser resizing or complete load of application.
   */
  initSizeListeners(): void {
    this.window.addEventListener('resize', () => {
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
    if (map === null) {
      return;
    }
    if (this.HsMapService.map) {
      this.HsMapService.map.updateSize();
      if (window.innerWidth < 767 || this.HsLayoutService.mainpanel != '') {
        this.HsLayoutService.smallWidth = true; //deprecated?
        this.HsLayoutService.sidebarLabels = false;
      } else {
        this.HsLayoutService.smallWidth = false; //deprecated?
        this.HsLayoutService.sidebarLabels = true;
      }
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
    if (
      this.window['getLRUser'] === undefined &&
      !this.missingLRFunctionsWarned
    ) {
      this.log.warn(
        'window.getLRUser function needs to be defined, which usually comes from liferay.'
      );
      this.missingLRFunctionsWarned = true;
    }
    if (this.window['getLRUser'] && this.window['getLRUser']() != 'guest') {
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
    if (this.window['cordova']) {
      return 'mobile';
    } else {
      return '';
    }
  }

  createComponentsEnabledConfigIfNeeded(): void {
    if (this.HsConfig.componentsEnabled === undefined) {
      this.HsConfig.componentsEnabled = {};
    }
  }

  /**
   * @deprecated Replaced by panelsEnabled config
   */
  exists(): true {
    if (!this.existsWarningShown) {
      this.existsWarningShown = true;
      this.log.warn(
        'Core.exists function will be removed. Please use panelsEnabled config option to set the statuses'
      );
    }
    return true;
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
      this.createComponentsEnabledConfigIfNeeded();
      this.HsConfig.componentsEnabled.toolbar = false;
      this.HsConfig.componentsEnabled.sidebar = false;
      this.HsConfig.componentsEnabled.geolocationButton = false;
      this.HsConfig.mapInteractionsEnabled = false;
      this.HsConfig.componentsEnabled.mapControls = false;
      this.HsLayoutService.sidebarVisible(false);
    }
  }
}
