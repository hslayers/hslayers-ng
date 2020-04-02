export default ['$rootScope', '$http', '$location', '$window', 'hs.map.service', 'Core', 'hs.utils.service', 'hs.save-map.service', 'config', 'hs.language.service', 'hs.layout.service', '$timeout',
  function ($rootScope, $http, $location, $window, OlMap, Core, utils, saveMap, config, languageService, layoutService, $timeout) {

    const url_generation = true;
    //some of the code is taken from http://stackoverflow.com/questions/22258793/set-url-parameters-without-causing-page-refresh
    let paramTimer = null;
    const me = {};

    angular.extend(me, {
      shareId: null,
      current_url: '',
      permalinkLayers: '',
      added_layers: [],
      params: {},
      customParams: {},

      /**
      * @function update
      * @memberof hs.permalink.urlService
      * @param {Object} e Event changing map state
      * Get actual map state information (visible layers, added layers*, active panel, map center and zoom level), create full Url link and push it in Url bar. (*Added layers are ommited from permalink url).
      */
      update: function (e) {
        const view = OlMap.map.getView();
        me.id = saveMap.generateUuid();
        const visible_layers = [];
        const added_layers = [];
        OlMap.map.getLayers().forEach((lyr) => {
          if (angular.isDefined(lyr.get('show_in_manager')) && lyr.get('show_in_manager') !== null && lyr.get('show_in_manager') == false) {
            return;
          }
          if (lyr.getVisible()) {
            visible_layers.push(lyr.get('title'));
          }
          if (lyr.manuallyAdded != false) {
            added_layers.push(lyr);
          }
        });
        me.added_layers = saveMap.layers2json(added_layers);

        if (layoutService.mainpanel) {
          if (layoutService.mainpanel == 'permalink') {
            me.push('hs_panel', 'layermanager');
          } else {
            me.push('hs_panel', layoutService.mainpanel);
          }
        }
        me.push('hs_x', view.getCenter()[0]);
        me.push('hs_y', view.getCenter()[1]);
        me.push('hs_z', view.getZoom());
        if (languageService.language) {
          me.push('lang', languageService.language);
        }
        me.push('visible_layers', visible_layers.join(';'));
        if (Core.puremapApp) {
          me.push('puremap', 'true');
        }
        for (const cP in me.customParams) {
          me.push(cP, me.customParams[cP]);
        }
        $timeout(()=>{
          $location.search(me.params);
        }, 0);
      },

      /**
      * @function getPermalinkUrl
      * @memberof hs.permalink.urlService
      * @returns {String} Permalink url
      * Create permalink Url to map
      */
      getPermalinkUrl: function () {
        let stringLayers = (angular.toJson(me.permalinkLayers));
        stringLayers = stringLayers.substring(1, stringLayers.length - 1);
        if (Core.isMobile() && config.permalinkLocation) {
          return (config.permalinkLocation.origin + me.current_url.replace($window.location.pathname, config.permalinkLocation.pathname) + '&permalink=' + encodeURIComponent(stringLayers)).replace($window.location.pathname, config.permalinkLocation.pathname);
        } else {
          return $window.location.origin + me.current_url + '&permalink=' + encodeURIComponent(stringLayers);
        }
      },

      /**
      * @function getPureMapUrl
      * @memberof hs.permalink.urlService
      * @returns {String} Embeded url
      * Create Url for PureMap version of map
      */
      getPureMapUrl: function () {
        const params = {};
        params.puremap = 'true';
        return me.getPermalinkUrl() + '&' + utils.paramsToURLWoEncode(params);
      },

      /**
      * @function parse
      * @memberof hs.permalink.urlService
      * @param {String} str Parameter string to parse
      * @returns {Object} Parsed parameter object
      * Parse parameter string from Url into key-value(s) pairs
      */
      parse: function (str) {
        if (!angular.isString(str)) {
          return {};
        }

        str = str.trim().replace(/^\?/, '');

        if (!str) {
          return {};
        }

        return str.trim().split('&').reduce((ret, param) => {
          const parts = param.replace(/\+/g, ' ').split('=');
          let key = parts[0];
          let val = parts[1];

          key = decodeURIComponent(key);
          // missing `=` should be `null`:
          // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
          val = angular.isUndefined(val) ? null : decodeURIComponent(val);

          if (!ret.hasOwnProperty(key)) {
            ret[key] = val;
          } else if (angular.isArray(ret[key])) {
            ret[key].push(val);
          } else {
            ret[key] = [ret[key], val];
          }

          return ret;
        }, {});
      },

      /**
      * @function stringify
      * @memberof hs.permalink.urlService
      * @param {Object} obj Parameter object to stringify
      * @returns {String} Encoded parameter string or "" if no parameter object is given
      * Create encoded parameter string from parameter object
      */
      stringify: function (obj) {
        return obj ? Object.keys(obj).map((key) => {
          const val = obj[key];

          if (angular.isArray(val)) {
            return val.map((val2) => {
              return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
            }).join('&');
          }

          return encodeURIComponent(key) + '=' + encodeURIComponent(val);
        }).join('&') : '';
      },

      /**
      * @function push
      * @memberof hs.permalink.urlService
      * @param {Object} key Key name for pushed parameter
      * @param {Object} new_value Value for pushed parameter
      * Push new key-value pair into paramater object and update Url string with new params
      */
      push: function (key, new_value) {
        me.params[key] = new_value;
        const new_params_string = me.stringify(me.params);
        me.param_string = new_params_string;
        me.pathname = $window.location.pathname;
        me.current_url = me.pathname + '?' + new_params_string;
      },

      /**
      * @function getParamValue
      * @memberof hs.permalink.urlService
      * @param {String} param Param to get current value
      * @returns {String} Current value for requested param or null if param doesn´t exist
      * Find current param value from Url
      */
      getParamValue: function (param) {
        const tmp = me.parse(location.search);
        if (tmp[param]) {
          return tmp[param];
        } else {
          return null;
        }
      },

      /**
      * @function updateCustomParams
      * @memberof hs.permalink.urlService
      * @param {Object} params A dictionary of custom parameters which get added to the generated url
      * Update values for custom parameters which get added to the url and usually are application speciffic
      */
      updateCustomParams: function (params) {
        for (const param in params) {
          me.customParams[param] = params[param];
        }
        if (paramTimer !== null) {
          clearTimeout(paramTimer);
        }
        paramTimer = $timeout(() => {
          me.update();
        }, 1000);
      }
    });


    /**
    * @function init
    * @memberof hs.permalink.urlService
    * @param {ol/Map} map Openlayers map
    * @private
    * Function for service initialization when map object is ready
    */
    function init(map) {
      if (url_generation) {
        let timer = null;
        // eslint-disable-next-line angular/on-watch
        $rootScope.$on('map.extent_changed', utils.debounce((event, data, b) => {
          me.update();
          $rootScope.$broadcast('browserurl.updated');
        }, 200, false, me));
        map.getLayers().on('add', (e) => {
          const layer = e.element;
          if (layer.get('show_in_manager') !== null
                        && layer.get('show_in_manager') == false) {
            return;
          }
          layer.on('change:visible', (e) => {
            if (timer !== null) {
              clearTimeout(timer);
            }
            timer = $timeout(() => {
              me.update();
              $rootScope.$broadcast('browserurl.updated');
            }, 1000);
          });
        });
        if (me.getParamValue('lang')) {
          languageService.setLanguage(me.getParamValue('lang'));
        }
      }
    }

    OlMap.loaded().then(init);
    return me;
  }
];
