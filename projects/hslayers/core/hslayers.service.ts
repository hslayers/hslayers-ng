import {Injectable, inject} from '@angular/core';

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
  private hsLanguageService = inject(HsLanguageService);
  hsMapService = inject(HsMapService);
  hsConfig = inject(HsConfig);
  hsLayoutService = inject(HsLayoutService);
  private log = inject(HsLogService);
  hsEventBusService = inject(HsEventBusService);

  embeddedEnabled = true;
  //TODO: remove
  //config: any;
  initCalled: boolean;
  //TODO: remove
  //missingLRFunctionsWarned: any;

  constructor() {
    this.hsLayoutService.layoutLoads.subscribe(({element, innerElement}) => {
      // Initialization function for HSLayers elements and their sizes.
      // Stores element and container references and sets event listeners for map resizing.
      if (
        window.innerWidth < this.hsConfig.mobileBreakpoint ||
        this.hsConfig.sidebarClosed
      ) {
        this.hsLayoutService.sidebarExpanded = false;
        this.hsLayoutService.sidebarLabels = false;
      } else {
        this.hsLayoutService.sidebarExpanded = true;
      }
      const translateService = this.hsLanguageService.getTranslator();
      if (!translateService.getFallbackLang()) {
        this.hsLanguageService.initLanguages();
      }
      if (this.initCalled) {
        return;
      }
      this.hsMapService.loaded().then(() => {
        this.initSizeListeners();
        setTimeout(() => {
          this.mapSizeUpdates();
        }, 750);
        this.initCalled = true;
      });
    });

    this.hsEventBusService.mapSizeUpdates.subscribe(() => {
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
          this.hsEventBusService.layoutResizes.next();
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
    const map = this.hsMapService.mapElement;
    if (map === null) {
      return;
    }
    if (this.hsMapService.map) {
      this.hsMapService.map.updateSize();
      if (
        window.innerWidth < this.hsConfig.mobileBreakpoint ||
        this.hsLayoutService.mainpanel
      ) {
        this.hsLayoutService.sidebarLabels = false;
      } else {
        this.hsLayoutService.sidebarLabels = true;
      }
    } else {
      this.log.log('Map not yet initialized!');
      return;
    }
    const neededSize = {
      width: map.offsetWidth,
      height: map.offsetHeight,
    };
    this.hsEventBusService.sizeChanges.next(neededSize);
  }

  /**
   * Do complete reset of map (view, layers) according to app config
   */
  resetMap(): void {
    this.hsMapService.reset();
    this.hsEventBusService.mapResets.next();
  }
}
