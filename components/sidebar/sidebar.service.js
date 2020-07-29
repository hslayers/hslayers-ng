/**
 * @param config
 * @param $rootScope
 * @param utils
 * @param gettext
 * @param HsLanguageService
 */
export class HsSidebarService {
  constructor(gettext, HsLanguageService) {
    'ngInject';
    this.extraButtons = [];
    angular.extend(this, {gettext, HsLanguageService});

    angular.extend(this, {
      /**
       * If buttons with importancy property exist.
       * If not, don't display expansion +/- icon
       *
       * @memberof HsSidebarService
       * @member buttons
       */
      unimportantExist: false,

      /**
       * List of sidebar buttons
       *
       * @memberof HsSidebarService
       * @member buttons
       */
      buttons: [
        {
          panel: 'layermanager',
          module: 'hs.layermanager',
          order: 0,
          title: gettext('Layer Manager'),
          description: gettext('Manage and style your layers in composition'),
          icon: 'icon-layers',
        },
        {
          panel: 'legend',
          module: 'hs.legend',
          order: 1,
          title: gettext('Legend'),
          description: gettext('Legend'),
          icon: 'icon-dotlist',
        },
        {
          panel: 'info',
          module: 'hs.query',
          order: 7,
          title: gettext('Info panel'),
          description: gettext('Display map-query result information'),
          icon: 'icon-info-sign',
        },
        {
          panel: 'composition_browser',
          module: 'hs.compositions',
          order: 3,
          title: gettext('Map Compositions'),
          description: gettext('List available map compositions'),
          icon: 'icon-map',
        },
        {
          panel: 'datasource_selector',
          module: 'hs.datasource_selector',
          order: 4,
          title: gettext('Add layers'),
          description: gettext(
            'Select data or services for your map composition'
          ),
          icon: 'icon-database',
        },
        {
          panel: 'feature_crossfilter',
          module: 'hs.feature_crossfilter.controller',
          order: 5,
          title: gettext('Filter features'),
          description: gettext('Crossfilter'),
          icon: 'icon-analytics-piechart',
        },
        {
          panel: 'sensors',
          module: 'hs.sensors',
          order: 6,
          title: gettext('Sensors'),
          description: gettext(''),
          icon: 'icon-weightscale',
        },
        {
          panel: 'measure',
          module: 'hs.measure',
          order: 2,
          title: gettext('Measurements'),
          description: gettext('Measure distance or area at map'),
          icon: 'icon-design',
          condition: true,
        },
        {
          panel: 'routing',
          module: 'HsRoutingController',
          order: 8,
          title: gettext('Routing'),
          description: gettext(''),
          icon: 'icon-road',
        },
        {
          panel: 'tracking',
          module: 'HsTrackingController',
          order: 9,
          title: gettext('Tracking'),
          description: gettext(''),
          icon: 'icon-screenshot',
        },
        {
          panel: 'print',
          module: 'hs.print',
          order: 10,
          title: gettext('Print'),
          description: gettext('Print map'),
          icon: 'icon-print',
        },
        {
          panel: 'permalink',
          module: 'hs.permalink',
          order: 11,
          title: gettext('Share map'),
          description: gettext('Share map'),
          icon: 'icon-share-alt',
        },
        {
          panel: 'saveMap',
          module: 'hs.save-map',
          order: 12,
          title: gettext('Save composition'),
          description: gettext('Save content of map to composition'),
          icon: 'icon-save-floppy',
        },
        {
          panel: 'language',
          module: 'HsLanguageController',
          order: 13,
          title: gettext('Change language'),
          description: gettext('Change language'),
          content: function () {
            return HsLanguageService.getCurrentLanguageCode().toUpperCase();
          },
        },
        {
          panel: 'mobile_settings',
          module: 'hs.mobile_settings.controller',
          order: 14,
          title: gettext('Application settings'),
          description: gettext('Specify application user settings'),
          icon: 'icon-settingsandroid',
        },
        {
          panel: 'search',
          module: 'HsSearchController',
          order: 15,
          title: gettext('Search'),
          description: gettext('Search for location'),
          icon: 'icon-search',
        },
        {
          panel: 'draw',
          module: 'hs.draw',
          order: 16,
          title: gettext('Draw'),
          description: gettext('Draw new features'),
          icon: 'icon-pencil',
        },
      ],

      /**
       * List of visible buttons taking into acount viewport size
       *
       * @memberof HsSidebarService
       * @member visibleButtons
       */
      visibleButtons: [],
    });
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
  setButtonImportancy(panelName, state) {
    this.buttons.filter((b) => b.panel == panelName)[0].important = state;
    this.unimportantExist =
      this.buttons.filter((b) => b.important == false).length > 0;
  }
}
