
import { Injectable, Inject } from '@angular/core';
import { HsConfig } from '../../config.service';
import { HsMapService } from '../map/map.service.js';
import { HsUtilsService } from '../utils/utils.service';
import { HsLayoutService } from '../layout/layout.service';
import { DOCUMENT } from '@angular/common';
import { HsLogService } from './log.service';
import { HsEventBusService } from './event-bus.service';

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
  embededEnabled: boolean = true;
  /**
   * @ngdoc property
   * @name HsCore#_exist_cache
   * @public
   * @type {object}
   * @description DEPRECATED?
   */
  _exist_cache: any = {};

  /**
   * @ngdoc property
   * @name HsCore#sizeOptions
   * @public
   * @type {object}
   * @description Hold data for computing app sizes. Shouldnt be modified directly. Holds reference to HS app element and optionally its container.
   */
  sizeOptions: any = {
    element: undefined,
    windowedMap: undefined,
    selector: undefined,
  };
  language: string = 'en';
  config: any;
  _puremapApp: boolean = false;
  initCalled: boolean;
  missingLRFunctionsWarned: any;
  singleDatasourcesWarningShown: boolean;
  existsWarningShown: any;


  constructor(private HsMapService: HsMapService,
    private HsConfig: HsConfig,
    private HsLayoutService: HsLayoutService,
    private HsUtilsService: HsUtilsService,
    private window: Window,
    private log: HsLogService,
    @Inject(DOCUMENT) private document: Document,
    private HsEventBusService: HsEventBusService) {
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
  }

  setMainPanel(which, by_gui) {
    this.log.warn(
      'setMainPanel will be removed from HsCore in future. Use HsLayoutService#setMainPanel method instead'
    );
    this.HsLayoutService.setMainPanel(which, by_gui);
  }

  setDefaultPanel(which) {
    this.log.warn(
      'setDefaultPanel will be removed from HsCore in future. Use HsLayoutService#setDefaultPanel method instead'
    );
    return this.HsLayoutService.setDefaultPanel(which);
  }

  panelVisible(which, scope) {
    this.log.warn(
      'panelVisible will be removed from HsCore in future. Use HsLayoutService#panelVisible method instead'
    );
    return this.HsLayoutService.panelVisible(which, scope);
  }

  panelEnabled(which, status) {
    this.log.warn(
      'panelEnabled will be removed from HsCore in future. Use HsLayoutService#panelEnabled method instead'
    );
    return this.HsLayoutService.panelEnabled(which, status);
  }

  closePanel(which) {
    this.log.warn(
      'closePanel will be removed from HsCore in future. Use HsLayoutService#closePanel method instead'
    );
    return this.HsLayoutService.closePanel(which);
  }

  fullScreenMap(element) {
    this.log.warn(
      'fullScreenMap will be removed from HsCore in future. Use HsLayoutService#fullScreenMap method instead'
    );
    return this.HsLayoutService.fullScreenMap(element, this);
  }

  get singleDatasources() {
    return this.HsConfig.allowAddExternalDatasets;
  }

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
  init(element, options) {
    if (this.initCalled) {
      return;
    }
    if (options) {
      options = {};
    }
    if (options.windowedMap) {
      this.sizeOptions.windowedMap = options.windowedMap;
    }
    this.sizeOptions.element = element;
    if (
      options.innerElement &&
      this.document.getElementById(options.innerElement.replace('#', ''))
    ) {
      this.sizeOptions.innerElement = this.document.getElementById(
        options.innerElement.replace('#', '')
      );
    }
    this.HsMapService.loaded().then((map) => {
      if (options.parent) {
        this.sizeOptions.selector = element.parent();
        this.initSizeListeners();
        this.updateElementSize();
      } else if (options.element) {
        this.sizeOptions.selector = options.element;
        this.initSizeListeners();
        this.updateElementSize();
      } else {
        this.initSizeListeners();
        this.updateMapSize();
      }

      this.initCalled = true;
    });
  }

  /**
   * @ngdoc method
   * @name HsCore#setSizeByContainer
   * @public
   * @description Change container for HS element.
   */
  setSizeByContainer() {
    //TODO Output warning if sizeOptions.element is not set
    this.sizeOptions.selector = this.sizeOptions.element.parent();
    this.updateElementSize();
  }

  /**
   * @ngdoc method
   * @name HsCore#setSizeByCSS
   * @public
   * @param {number} height New height of HS element in pixels
   * @param {number} width New width of HS element in pixels
   * @description Change HS element size programmatically (currently accept only integer value of pixels).
   */
  setSizeByCSS(height, width) {
    if (this.sizeOptions.selector) {
      this.sizeOptions.selector = undefined;
    }
    const element = this.sizeOptions.element;
    element.style.height = height + 'px';
    element.style.width = width + 'px';
    this.updateMapSize();
  }

  /**
   * @ngdoc method
   * @name HsCore#initSizeListeners
   * @public
   * @description Add event listeners for updating HS element and map size after browser resizing or complete load of application.
   */
  initSizeListeners() {
    const w = this.window;
    /**
     * @ngdoc method
     * @name HsCore#updateVH
     * @private
     * @description Define and change size of CSS custom variable --vh used as reference for hs.app-height
     */
    const updateVH = this.HsUtilsService.debounce(
      () => {
        if (this.sizeOptions.mode != 'fullscreen') {
          return;
        }
        const vh = w.innerHeight * 0.01;
        this.document.body.style.setProperty('--vh', `${vh}px`);

        if (w.matchMedia('(orientation: portrait)').matches) {
          this.document.getElementsByTagName('html')[0].style.height = '100vh';
          setTimeout(() => {
            this.document.getElementsByTagName('html')[0].style.height = '100%';
          }, 500);
        }
      },
      150,
      false,
      this
    );

    w.addEventListener('resize', () => {
      updateVH();
      this.sizeOptions.selector === undefined
        ? this.updateMapSize()
        : this.updateElementSize();
    });

    this.sizeOptions.selector === undefined
      ? this.updateMapSize()
      : this.updateElementSize();
    w.addEventListener('load', () => {
      //onload checker for cases when bootstrap css change box-sizing property
      this.sizeOptions.selector === undefined
        ? this.updateMapSize()
        : this.updateElementSize();
    });
  }

  /**
   * @ngdoc method
   * @name HsCore#updateElementSize
   * @public
   * @description Update HS element size by its container sizes.
   */
  updateElementSize() {
    const element = this.sizeOptions.element[0];
    const container = this.sizeOptions.selector[0];
    element.style.height = container.clientHeight + 'px';
    element.style.width = container.offsetWidth + 'px';
    this.updateMapSize();
  }

  /**
   * @ngdoc method
   * @name HsCore#updateMapSize
   * @public
   * @description Update map size.
   */
  updateMapSize() {
    const container = this.sizeOptions.innerElement !== undefined
      ? this.sizeOptions.innerElement
      : this.sizeOptions.element[0];
    const map = this.HsLayoutService.contentWrapper.querySelector('.hs-ol-map');
    if (map === null) {
      return;
    }
    let sidebarElem = null;
    if (
      this.HsLayoutService.contentWrapper.getElementsByClassName('hs-panelspace')
        .length > 0
    ) {
      sidebarElem = this.HsLayoutService.contentWrapper.querySelector(
        '.hs-panelspace'
      );
    }
    const neededSize = { width: 0, height: container.clientHeight };

    if (this.puremapApp) {
      neededSize.width = container.offsetWidth;
    } else if (sidebarElem === null) {
      neededSize.width = container.offsetWidth;
    } else if (
      sidebarElem !== null &&
      container.offsetWidth > sidebarElem.offsetWidth
    ) {
      neededSize.width = container.offsetWidth - sidebarElem.offsetWidth;
    }
    // map.style.height = neededSize.height + 'px';
    // map.style.width = neededSize.width + 'px';
    if (this.HsMapService.map) {
      this.HsMapService.map.updateSize();
      if (map.offsetWidth < 767) {
        this.HsLayoutService.smallWidth = true
      } else {
        this.HsLayoutService.smallWidth = false
      }
    }

    this.HsEventBusService.sizeChanges.next(neededSize);
  }

  /**
   * @ngdoc method
   * @name HsCore#isAuthorized
   * @public
   * @returns {boolean} Check result - true for authorized user
   * @description Do authorization check of User, currently authorization is possible only in connection with Lifearray app
   */
  isAuthorized() {
    if (
      this.window['getLRUser'] === undefined &&
      this.missingLRFunctionsWarned === undefined
    ) {
      this.log.warn(
        'window.getLRUser function needs to be defined, which usually comes from liferay.'
      );
      this.missingLRFunctionsWarned = true;
    }
    if (
      this.window['getLRUser'] &&
      this.window['getLRUser']() != 'guest'
    ) {
      return true;
    }
    return true;
  }

  /**
   * @ngdoc method
   * @name HsCore#resetMap
   * @public
   * @description Do complete reset of map (view, layers) according to app config
   */
  resetMap() {
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
  isMobile() {
    if (this.window['cordova']) {
      return 'mobile';
    } else {
      return '';
    }
  }

  createComponentsEnabledConfigIfNeeded() {
    if (this.HsConfig.componentsEnabled === undefined) {
      this.HsConfig.componentsEnabled = {};
    }
  }

  exists() {
    if (!this.existsWarningShown) {
      this.existsWarningShown = true;
      this.log.warn('Core.exists function will be removed. Please use panelsEnabled config option to set the statuses');
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
