import {Injectable} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';

import {HsLanguageService} from 'hslayers-ng/services/language';
import {debounce} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HslayersService {
  embeddedEnabled = true;
  //TODO: remove
  //config: any;
  initCalled: boolean;
  //TODO: remove
  //missingLRFunctionsWarned: any;

  constructor(
    private hsLanguageService: HsLanguageService,
    public HsMapService: HsMapService,
    public hsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    private log: HsLogService,
    public HsEventBusService: HsEventBusService,
  ) {
    this.HsLayoutService.layoutLoads.subscribe(({element, innerElement}) => {
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
          this.mapSizeUpdates();
        }, 750);
        this.initCalled = true;
      });
    });

    this.HsEventBusService.mapSizeUpdates.subscribe(() => {
      this.mapSizeUpdates();
    });
  }

  /**
   * Add event listeners for updating HS element and map size after browser resizing or complete load of application.
   */
  initSizeListeners(): void {
    window.addEventListener('resize', () => {
      debounce(
        function () {
          this.mapSizeUpdates();
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
   */
  mapSizeUpdates(): void {
    const map = this.HsMapService.mapElement;
    if (map === null) {
      return;
    }
    if (this.HsMapService.map) {
      this.HsMapService.map.updateSize();
      if (
        window.innerWidth < this.hsConfig.mobileBreakpoint ||
        this.HsLayoutService.mainpanel
      ) {
        this.HsLayoutService.sidebarLabels = false;
      } else {
        this.HsLayoutService.sidebarLabels = true;
      }
    } else {
      this.log.log('Map not yet initialized!');
      return;
    }
    const neededSize = {
      width: map.offsetWidth,
      height: map.offsetHeight,
    };
    this.HsEventBusService.sizeChanges.next(neededSize);
  }

  /**
   * Do complete reset of map (view, layers) according to app config
   */
  resetMap(): void {
    this.HsMapService.reset();
    this.HsEventBusService.mapResets.next();
  }
}
