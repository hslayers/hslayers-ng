import '../layers/hs.source.SparqlJson';
import 'angular-socialshare';
import {transform} from 'ol/proj';

/**
 * @param HsMapService
 * @param HsConfig
 * @param $rootScope
 * @param $http
 * @param HsUtilsService
 * @param HsCompositionsLayerParserService
 * @param HsLayoutService
 * @param $log
 */
export default function (
  HsMapService,
  HsConfig,
  $rootScope,
  $http,
  HsUtilsService,
  HsCompositionsLayerParserService,
  HsLayoutService,
  $log
) {
  'ngInject';
  const me = {
    /**
     * @ngdoc property
     * @name HsCompositionsParserService#composition_loaded
     * @public
     * @type {string} null
     * @description Stores current composition URL if there is one or NULL
     */
    composition_loaded: null,
    /**
     * @ngdoc property
     * @name HsCompositionsParserService#composition_edited
     * @public
     * @type {boolean} null
     * @description Stores whether current composition was edited (for composition changes, saving etc.)
     */
    composition_edited: false,
    utils: HsUtilsService,
    /**
     * @ngdoc property
     * @name HsCompositionsParserService#current_composition_title
     * @public
     * @type {string} ""
     * @description Stores title of current composition
     */
    current_composition_title: '',
    /**
     * @ngdoc method
     * @name HsCompositionsParserService#load
     * @public
     * @param {string} url Url of selected composition
     * @param {boolean} overwrite Whether overwrite current composition in map - remove all layers from maps which originate from composition (if not pasted, it counts as "true")
     * @param {Function} callback Optional function which should be called when composition is successfully loaded
     * @param {Function} pre_parse Optional function for pre-parsing loaded data about composition to accepted format
     * @description Load selected composition from server, parse it and add layers to map. Optionally (based on app config) may open layer manager panel
     */
    loadUrl: function (url, overwrite, callback, pre_parse) {
      return new Promise((resolve, reject) => {
        me.current_composition_url = url;
        url = url.replace('&amp;', '&');
        url = HsUtilsService.proxify(url);
        $http({url: url, overwrite, callback, pre_parse})
          .then(me.loaded, (err) => {})
          .then(() => {
            resolve();
          });
      });
    },

    loaded(response) {
      /**
       * @ngdoc event
       * @name HsCompositionsParserService#compositions.composition_loading
       * @eventType broadcast on $rootScope
       * @description Fires when composition is downloaded from server and parsing begins
       */
      $rootScope.$broadcast('compositions.composition_loading', response.data);
      if (me.checkLoadSuccess(response)) {
        me.composition_loaded = response.config.url;
        if (angular.isDefined(response.config.pre_parse)) {
          response = response.config.pre_parse(response.data);
        }
        /*
                    Response might contain {data:{abstract:...}} or {abstract:}
                    directly. If there is data object,
                    that means composition is enclosed in
                    container which itself might contain title or extent
                    properties */
        me.loadCompositionObject(
          response.data.data || response.data,
          response.config.overwrite,
          response.title,
          response.extent
        );
        me.finalizeCompositionLoading(response.data);
        if (angular.isFunction(response.config.callback)) {
          response.config.callback();
        }
      } else {
        me.raiseCompositionLoadError(response.data);
      }
    },

    checkLoadSuccess(response) {
      return (
        response.data.success == true /*micka*/ ||
        (angular.isUndefined(response.data.success) /*layman*/ &&
          angular.isDefined(response.data.name))
      );
    },

    loadCompositionObject: function (
      obj,
      overwrite,
      titleFromContainer,
      extentFromContainer
    ) {
      if (angular.isUndefined(overwrite) || overwrite == true) {
        me.removeCompositionLayers();
      }
      me.current_composition = obj;
      me.current_composition_title = titleFromContainer || obj.title;
      HsMapService.map
        .getView()
        .fit(
          me.parseExtent(extentFromContainer || obj.extent),
          HsMapService.map.getSize()
        );
      const layers = me.jsonToLayers(obj);
      layers.forEach((lyr) => {
        HsMapService.addLayer(lyr, true);
      });

      if (angular.isObject(obj.current_base_layer)) {
        HsMapService.map.getLayers().forEach((lyr) => {
          if (lyr.get('title') == obj.current_base_layer.title) {
            lyr.setVisible(true);
          }
        });
      }
    },

    finalizeCompositionLoading: function (responseData) {
      if (HsConfig.open_lm_after_comp_loaded) {
        HsLayoutService.setMainPanel('layermanager');
      }

      me.composition_edited = false;
      /**
       * @ngdoc event
       * @name HsCompositionsParserService#compositions.composition_loaded
       * @eventType broadcast on $rootScope
       * @description Fires when composition is loaded or not loaded with Error message
       */
      $rootScope.$broadcast('compositions.composition_loaded', responseData);
    },

    raiseCompositionLoadError: function (response) {
      const respError = {};
      respError.error = response.error;
      switch (response.error) {
        case 'no data':
          respError.title = 'Composition not found';
          respError.abstract =
            'Sorry but composition was deleted or incorrectly saved';
          break;
      }
      $rootScope.$broadcast('compositions.composition_loaded', respError);
    },

    /**
     * @ngdoc method
     * @name HsCompositionsParserService#removeCompositionLayers
     * @public
     * @description Remove all layers gained from composition from map
     */
    removeCompositionLayers: function () {
      const to_be_removed = [];
      HsMapService.map.getLayers().forEach((lyr) => {
        if (lyr.get('from_composition')) {
          to_be_removed.push(lyr);
        }
      });
      while (to_be_removed.length > 0) {
        HsMapService.map.removeLayer(to_be_removed.shift());
      }
    },
    /**
     * @ngdoc method
     * @name HsCompositionsParserService#loadInfo
     * @public
     * @param {string} url Url to composition info
     * @param cb
     * @returns {object} Object containing composition info
     * @description Send Ajax request to selected server to gain information about composition
     */
    loadInfo: function (url, cb) {
      let info = {};
      url = url.replace('&amp;', '&');
      url = HsUtilsService.proxify(url);
      $http({url: url}).then(
        (response) => {
          info = response.data.data || response.data;
          /**
           * @ngdoc event
           * @name HsCompositionsParserService#compositions.composition_info_loaded
           * @eventType broadcast on $rootScope
           * @description Fires when metadata about selected composition are loaded
           */
          $rootScope.$broadcast(
            'compositions.composition_info_loaded',
            response.data
          );
          cb(info);
        },
        (err) => {}
      );
    },

    parseExtent: function (b) {
      if (typeof b == 'string') {
        b = b.split(' ');
      }
      let first_pair = [parseFloat(b[0]), parseFloat(b[1])];
      let second_pair = [parseFloat(b[2]), parseFloat(b[3])];
      first_pair = transform(
        first_pair,
        'EPSG:4326',
        HsMapService.map.getView().getProjection()
      );
      second_pair = transform(
        second_pair,
        'EPSG:4326',
        HsMapService.map.getView().getProjection()
      );
      return [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
    },

    /**
     * @ngdoc method
     * @name HsCompositionsParserService#jsonToLayers
     * @public
     * @param {object} j Composition object with Layers
     * @returns {Array} Array of created layers
     * @description Parse composition object to extract individual layers and add them to map
     */
    jsonToLayers: function (j) {
      const layers = [];
      if (j.data) {
        j = j.data;
      }
      for (let i = 0; i < j.layers.length; i++) {
        const lyr_def = j.layers[i];
        const layer = me.jsonToLayer(lyr_def);
        if (angular.isUndefined(layer)) {
          $log.warn('Was not able to parse layer from composition', lyr_def);
        } else {
          layers.push(layer);
        }
      }
      return layers;
    },

    /**
     * @ngdoc method
     * @name HsCompositionsParserService#jsonToLayer
     * @public
     * @param {object} lyr_def Layer to be created (encapsulated in layer definition object)
     * @returns {Function} Parser function to create layer (using config_parsers service)
     * @description Select correct layer parser for input data based on layer "className" property (HSLayers.Layer.WMS/OpenLayers.Layer.Vector)
     */
    jsonToLayer: function (lyr_def) {
      switch (lyr_def.className) {
        case 'HSLayers.Layer.WMS':
          return HsCompositionsLayerParserService.createWmsLayer(lyr_def);
        case 'ArcGISRest':
          return HsCompositionsLayerParserService.createArcGISLayer(lyr_def);
        case 'XYZ':
          return HsCompositionsLayerParserService.createXYZLayer(lyr_def);
        case 'StaticImage':
          return HsCompositionsLayerParserService.createStaticImageLayer(
            lyr_def
          );
        case 'OpenLayers.Layer.Vector':
          return HsCompositionsLayerParserService.createVectorLayer(lyr_def);
        default:
          return;
      }
    },
  };

  return me;
}
