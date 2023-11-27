import {HsConfig} from '../../config.service';
import {HsEventBusService} from './event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';

import {HsLanguageService} from '../language/language.service';
import {HsQueryWmsService} from '../query/query-wms.service';

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
    /**
     * Just to init a service, keep
     */
    private hsQueryWmsService: HsQueryWmsService,
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
      const translateService = this.hsLanguageService.getTranslator();
      if (!translateService.defaultLang) {
        this.hsLanguageService.initLanguages();
      }
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
