/* eslint-disable @typescript-eslint/no-explicit-any */
import {HsLayoutService} from '../layout/layout.service';
import {Injectable} from '@angular/core';
// HsLanguageService not yet refactored
/**
 * param HsLanguageService
 */
@Injectable({
  providedIn: 'root',
})
export class HsSidebarService {
  extraButtons: Array<any> = [];
  buttons: Array<any> = [];
  unimportantExist: boolean;
  visibleButtons: Array<any> = [];
  constructor(private HsLayoutService: HsLayoutService) {
    this.extraButtons = [];
    /**
     * If buttons with importancy property exist.
     * If not, don't display expansion +/- icon
     *
     * @memberof HsSidebarService
     * @member buttons
     */
    this.unimportantExist = false;
    /**
     * List of visible buttons taking into acount viewport size
     *
     * @memberof HsSidebarService
     * @member visibleButtons
     */

    this.visibleButtons = [];
    /**
     * List of sidebar buttons
     *
     * @memberof HsSidebarService
     * @member buttons
     */
    this.buttons = [
      {
        panel: 'layermanager',
        module: 'hs.layermanager',
        order: 0,
        title: 'Layer Manager',
        description: 'Manage and style your layers in composition',
        icon: 'icon-layers',
      },
      {
        panel: 'legend',
        module: 'hs.legend',
        order: 1,
        title: 'Legend',
        description: 'Legend',
        icon: 'icon-dotlist',
      },
      {
        panel: 'info',
        module: 'hs.query',
        order: 7,
        title: 'Info panel',
        description: 'Display map-query result information',
        icon: 'icon-info-sign',
      },
      {
        panel: 'composition_browser',
        module: 'hs.compositions',
        order: 3,
        title: 'Map Compositions',
        description: 'List available map compositions',
        icon: 'icon-map',
      },
      {
        panel: 'datasource_selector',
        module: 'hs.datasource_selector',
        order: 4,
        title: 'Add layers',
        description: 'Select data or services for your map composition',
        icon: 'icon-database',
      },
      {
        panel: 'feature_crossfilter',
        module: 'hs.feature_crossfilter.controller',
        order: 5,
        title: 'Filter features',
        description: 'Crossfilter',
        icon: 'icon-analytics-piechart',
      },
      {
        panel: 'sensors',
        module: 'hs.sensors',
        order: 6,
        title: 'Sensors',
        description: '',
        icon: 'icon-weightscale',
      },
      {
        panel: 'measure',
        module: 'hs.measure',
        order: 2,
        title: 'Measurements',
        description: 'Measure distance or area at map',
        icon: 'icon-design',
        condition: true,
      },
      {
        panel: 'routing',
        module: 'HsRoutingController',
        order: 8,
        title: 'Routing',
        description: '',
        icon: 'icon-road',
      },
      {
        panel: 'tracking',
        module: 'HsTrackingController',
        order: 9,
        title: 'Tracking',
        description: '',
        icon: 'icon-screenshot',
      },
      {
        panel: 'print',
        module: 'hs.print',
        order: 10,
        title: 'Print',
        description: 'Print map',
        icon: 'icon-print',
      },
      {
        panel: 'permalink',
        module: 'hs.permalink',
        order: 11,
        title: 'Share map',
        description: 'Share map',
        icon: 'icon-share-alt',
      },
      {
        panel: 'saveMap',
        module: 'hs.save-map',
        order: 12,
        title: 'Save composition',
        description: 'Save content of map to composition',
        icon: 'icon-save-floppy',
      },
      {
        panel: 'language',
        module: 'HsLanguageController',
        order: 13,
        title: 'Change language',
        description: 'Change language',
        content: function (): string {
          return 'EN';
          //return HsLanguageService.getCurrentLanguageCode().toUpperCase();
        },
      },
      {
        panel: 'mobile_settings',
        module: 'hs.mobile_settings.controller',
        order: 14,
        title: 'Application settings',
        description: 'Specify application user settings',
        icon: 'icon-settingsandroid',
      },
      {
        panel: 'search',
        module: 'HsSearchController',
        order: 15,
        title: 'Search',
        description: 'Search for location',
        icon: 'icon-search',
      },
      {
        panel: 'draw',
        module: 'hs.draw',
        order: 16,
        title: 'Draw',
        description: 'Draw new features',
        icon: 'icon-pencil',
      },
    ];
  }

  /**
   * Function to set if a button is important and always visible
   * or only when the sidebar buttons are expanded
   *
   * @memberof HsSidebarService
   * @function setButtonImportancy
   * @param panelName
   * @param state
   */
  setButtonImportancy(panelName: string, state: any): void {
    this.buttons.filter((b) => b.panel == panelName)[0].important = state;
    this.unimportantExist =
      this.buttons.filter((b) => b.important == false).length > 0;
  }

  buttonClicked(button: any): void {
    if (button.click) {
      button.click();
    } else {
      this.HsLayoutService.setMainPanel(button.panel, true);
    }
  }
}
