/* eslint-disable angular/timeout-service */
/**
 * @param $rootScope
 * @param $location
 * @param $window
 * @param HsMapService
 * @param HsCore
 * @param HsUtilsService
 * @param HsSaveMapService
 * @param HsConfig
 * @param HsLanguageService
 * @param HsLayoutService
 * @param $timeout
 */
export default function (
  $rootScope,
  $location,
  HsMapService,
  HsCore,
  HsUtilsService,
  HsSaveMapService,
  HsConfig,
  HsLanguageService,
  HsLayoutService,
  HsLayermanagerService,
  $timeout
) {
  'ngInject';
  const url_generation = true;
  //some of the code is taken from http://stackoverflow.com/questions/22258793/set-url-parameters-without-causing-page-refresh
  let paramTimer = null;
  const me = {};

  angular.extend(me, {
    shareId: null,
    current_url: '',
    permalinkRequestUrl: '',
    //TODO remove keeping track of added layers, because perlalink should also be generated on other cases like remove layer, visibility change etc.
    added_layers: [],
    params: {},
    customParams: {},

    /**
     * @function update
     * @memberof HsPermalinkUrlService
     * @param {object} e Event changing map state
     * Get actual map state information (visible layers, added layers*, active panel, map center and zoom level), create full Url link and push it in Url bar. (*Added layers are ommited from permalink url).
     */
    update: function (e) {
      const view = HsMapService.map.getView();
      me.id = HsSaveMapService.generateUuid();
      const visible_layers = [];
      const added_layers = [];
      HsMapService.map.getLayers().forEach((lyr) => {
        if (
          angular.isDefined(lyr.get('show_in_manager')) &&
          lyr.get('show_in_manager') !== null &&
          lyr.get('show_in_manager') == false
        ) {
          return;
        }
        if (lyr.getVisible()) {
          visible_layers.push(lyr.get('title'));
        }
        if (lyr.manuallyAdded != false) {
          added_layers.push(lyr);
        }
      });
      me.added_layers = HsSaveMapService.layers2json(added_layers);

      var currentLayer = HsLayermanagerService.currentLayer;
      var featureURI = currentLayer.layer.get('featureURI');

      if (HsLayoutService.mainpanel) {
        if (HsLayoutService.mainpanel == 'permalink') {
          me.push('hs_panel', 'layermanager');
        } else {
          me.push('hs_panel', HsLayoutService.mainpanel);
        }
      }
      me.push('hs_x', view.getCenter()[0]);
      me.push('hs_y', view.getCenter()[1]);
      me.push('hs_z', view.getZoom());
      if (HsLanguageService.language) {
        me.push('lang', HsLanguageService.language);
      }
      me.push('visible_layers', visible_layers.join(';'));
      if (HsCore.puremapApp) {
        me.push('puremap', 'true');
      }
      for (const cP in me.customParams) {
        me.push(cP, me.customParams[cP]);
      }
      
      if (angular.isUndefined(featureURI)) {
        console.log('angular.isUndefined(featureURI)');
        $location.search(me.params);
      }
      else {
        console.log('no angular.isUndefined(featureURI)');
        console.log(currentLayer);
        if(! angular.isUndefined(currentLayer.selectedFeature)){
          console.log(";! angular.isUndefined(currentLayer.selectedFeature");
          me.featureAsUrl(currentLayer.selectedFeature.get(featureURI));
        }
        else {
          console.log("no ;! angular.isUndefined(currentLayer.selectedFeature");
          if (me.hashtagParam()) {
            history.pushState("", document.title, window.location.pathname + window.location.search);
          }
        }
      }

    },

    /**
     * @function getPermalinkUrl
     * @memberof HsPermalinkUrlService
     * @returns {string} Permalink url
     * Create permalink Url to map
     */
    getPermalinkUrl: function () {
      if (HsCore.isMobile() && HsConfig.permalinkLocation) {
        return (
          HsConfig.permalinkLocation.origin +
          me.current_url.replace(
            $location.path(),
            HsConfig.permalinkLocation.pathname
          ) +
          '&permalink=' +
          encodeURIComponent(me.permalinkRequestUrl)
        ).replace($location.path(), HsConfig.permalinkLocation.pathname);
      } else {
        const portIfNeeded =
          [80, 443].indexOf($location.port()) > -1
            ? ''
            : `:${$location.port()}`;
        return `${$location.protocol()}://${$location.host()}${portIfNeeded}/${
          me.current_url
        }&permalink=${encodeURIComponent(me.permalinkRequestUrl)}`;
      }
    },

    /**
     * @function getPureMapUrl
     * @memberof HsPermalinkUrlService
     * @returns {string} Embeded url
     * Create Url for PureMap version of map
     */
    getPureMapUrl: function () {
      const params = {};
      params.puremap = 'true';
      return (
        me.getPermalinkUrl() + '&' + HsUtilsService.paramsToURLWoEncode(params)
      );
    },

    getFeatureByUri: function(features, uri, uriname){
      var selected;
      features.forEach((feature, i) => {
        if (feature.getProperties()[uriname] == uri){
          selected = feature;
        }
      });
      console.log(selected);
      $rootScope.$broadcast('map.selectedFeatureDetected', selected);
      $rootScope.$broadcast('vectorQuery.featureSelected', selected);
    },

    featureAsUrl: function (uri) {
      me.param_string = uri;
      me.pathname = window.location.pathname;
      me.current_url = me.pathname + '#' + uri;
      location.hash = uri;
      me.params = {};
      $location.search(me.params);
    },

    hashtagParam: function(){
      if (!location.hash){
        return false;
      }
      return location.hash.substring(1);
    },

    /**
     * @function parse
     * @memberof HsPermalinkUrlService
     * @param {string} str Parameter string to parse
     * @returns {object} Parsed parameter object
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

      return str
        .trim()
        .split('&')
        .reduce((ret, param) => {
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
     * @memberof HsPermalinkUrlService
     * @param {object} obj Parameter object to stringify
     * @returns {string} Encoded parameter string or "" if no parameter object is given
     * Create encoded parameter string from parameter object
     */
    stringify: function (obj) {
      return obj
        ? Object.keys(obj)
            .map((key) => {
              const val = obj[key];

              if (angular.isArray(val)) {
                return val
                  .map((val2) => {
                    return (
                      encodeURIComponent(key) + '=' + encodeURIComponent(val2)
                    );
                  })
                  .join('&');
              }

              return encodeURIComponent(key) + '=' + encodeURIComponent(val);
            })
            .join('&')
        : '';
    },

    /**
     * @function push
     * @memberof HsPermalinkUrlService
     * @param {object} key Key name for pushed parameter
     * @param {object} new_value Value for pushed parameter
     * Push new key-value pair into paramater object and update Url string with new params
     */
    push: function (key, new_value) {
      me.params[key] = new_value;
      const new_params_string = me.stringify(me.params);
      me.param_string = new_params_string;
      me.pathname = $location.path();
      me.current_url = me.pathname + '?' + new_params_string;
    },

    /**
     * @function getParamValue
     * @memberof HsPermalinkUrlService
     * @param {string} param Param to get current value
     * @returns {string} Current value for requested param or null if param doesn´t exist
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
     * @memberof HsPermalinkUrlService
     * @param {object} params A dictionary of custom parameters which get added to the generated url
     * Update values for custom parameters which get added to the url and usually are application speciffic
     */
    updateCustomParams: function (params) {
      for (const param in params) {
        me.customParams[param] = params[param];
      }
      if (paramTimer !== null) {
        clearTimeout(paramTimer);
      }
      paramTimer = setTimeout(() => {
        me.update();
      }, 1000);
    },
  });

  /**
   * @function init
   * @memberof HsPermalinkUrlService
   * @param {ol/Map} map Openlayers map
   * @private
   */
  function init(map) {
    if (url_generation) {
      let timer = null;
      // eslint-disable-next-line angular/on-watch
      $rootScope.$on(
        'map.extent_changed',
        HsUtilsService.debounce(
          (event, data, b) => {
            me.update();
            $rootScope.$broadcast('browserurl.updated');
          },
          200,
          false,
          me
        )
      );

      if(me.hashtagParam()){
        me.uri =  me.hashtagParam();
        var layer = HsLayermanagerService.currentLayer.layer;
        var source = layer.getSource();
        source.once('change', function (e) {
            if (source.getState() === 'ready') {
                me.getFeatureByUri(source.getFeatures(), me.uri, layer.get('featureURI'));
            }
        });
      };

      map.getLayers().on('add', (e) => {
        const layer = e.element;
        if (
          layer.get('show_in_manager') !== null &&
          layer.get('show_in_manager') == false
        ) {
          return;
        }
        layer.on('change:visible', (e) => {
          if (timer !== null) {
            clearTimeout(timer);
          }
          timer = setTimeout(() => {
            me.update();
            $rootScope.$broadcast('browserurl.updated');
          }, 1000);
        });
      });
      if (me.getParamValue('lang')) {
        HsLanguageService.setLanguage(me.getParamValue('lang'));
      }
    }
  }

  HsMapService.loaded().then(init);
  return me;
}
