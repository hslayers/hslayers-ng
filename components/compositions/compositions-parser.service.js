import '../layers/hs.source.SparqlJson';
import 'angular-socialshare';
import * as xml2Json from 'xml-js';
import {transform, transformExtent} from 'ol/proj';

/**
 * @param HsMapService
 * @param HsConfig
 * @param $rootScope
 * @param $http
 * @param HsUtilsService
 * @param HsCompositionsLayerParserService
 * @param HsLayoutService
 * @param $log
 * @param $compile
 */
export default function (
  HsMapService,
  HsConfig,
  $rootScope,
  $http,
  HsUtilsService,
  HsCompositionsLayerParserService,
  HsLayoutService,
  $log,
  $compile
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

    createErrorDialog: function (
      text = 'Unspecified processing error',
      e = ''
    ) {
      const error = e.message ? e.message : e;
      const scope = $rootScope.$new();
      Object.assign(scope, {
        text,
        error,
      });
      const el = angular.element(
        '<hs.compositions.error_dialog_component error="text" msg = "error" ></hs.compositions.error_dialog_component>'
      );
      HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);
      $compile(el)(scope);
    },

    /**
     * @ngdoc method
     * @name HsCompositionsParserService#load
     * @public
     * @param {string} url Url of selected composition
     * @param {boolean} overwrite Whether overwrite current composition in map - remove all layers from maps which originate from composition (if not pasted, it counts as "true")
     * @param {Function} callback Optional function which should be called when composition is successfully loaded
     * @param {Function} pre_parse Optional function for pre-parsing loaded data about composition to accepted format
     * @returns {Promise<void>}
     * @description Load selected composition from server, parse it and add layers to map. Optionally (based on app config) may open layer manager panel
     */
    loadUrl: function (url, overwrite, callback, pre_parse) {
      return new Promise((resolve, reject) => {
        me.current_composition_url = url;
        url = url.replace(/&amp;/g, '&');
        url = HsUtilsService.proxify(url);

        if (url.includes('.wmc')) {
          $http({url: url, overwrite, callback, pre_parse})
            .then((response) => {
              return me.parseWMC(response);
            })
            .then(me.loaded)
            .then(() => {
              resolve();
            })
            .catch(reject);
        } else {
          $http({url: url, overwrite, callback, pre_parse})
            .then((res) => {
              if (res.data.file) {
                // Layman composition wrapper
                return me.loadUrl(
                  res.data.file.url,
                  overwrite,
                  callback,
                  pre_parse
                );
              } else {
                return me.loaded(res);
              }
            })
            .then(() => {
              resolve();
            })
            .catch(reject);
        }
      });
    },

    /**
     * @ngdoc method
     * @name HsCompositionsParserService#parseWMC
     * @public
     * @param {object} response http response body
     * @description Parses .wmc composition format into hsl composition json
     */
    parseWMC(response) {
      const res = xml2Json.xml2js(response.data, {compact: true}).ViewContext;
      const compositionJSON = {
        'current_base_layer': {
          'title': 'Composite_base_layer',
        },
        'extent': [
          parseFloat(res.General.BoundingBox._attributes['maxx']),
          parseFloat(res.General.BoundingBox._attributes['maxy']),
          parseFloat(res.General.BoundingBox._attributes['minx']),
          parseFloat(res.General.BoundingBox._attributes['miny']),
        ],
        layers: [],
        'units': res.LayerList.Layer[0].Extension['ol:units']._text,
        scale: 1,
      };

      compositionJSON.name = res.General.Title._text;
      compositionJSON.projection = res.General.BoundingBox._attributes.SRS;
      compositionJSON.projection =
        compositionJSON.projection == 'EPSG:102067'
          ? 'EPSG:5514'
          : compositionJSON.projection;

      compositionJSON.extent = transformExtent(
        compositionJSON.extent,
        compositionJSON.projection,
        'EPSG:4326'
      );

      for (const layer of res.LayerList.Layer) {
        const layerToAdd = {
          'className': 'HSLayers.Layer.WMS',
          'dimensions': {},
          'legends': [''],
          'maxResolution': null,
          'metadata': {},
          'minResolution': 0,
          'opacity': layer.Extension['ol:opacity']
            ? parseFloat(layer.Extension['ol:opacity']._text)
            : 1,
          'base': layer.Extension['ol:displayInLayerSwitcher']._text,
          'params': {
            'FORMAT': 'image/png',
            'INFO_FORMAT': 'text/html',
            'LAYERS': layer.Name._text,
            'VERSION': layer.Server._attributes.version,
          },
          'ratio': 1.5,
          'singleTile': true,
          'title': layer.Extension['hsl:layer_title']._text,
          'url': layer.Server.OnlineResource._attributes['xlink:href'],
          'visibility': true,
          'wmsMaxScale': 0,
        };
        compositionJSON.layers.push(layerToAdd);
      }
      response.data = compositionJSON;
      return response;
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
    loadCompositionObject: async function (
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
      const extent = me.parseExtent(extentFromContainer || obj.extent);
      if (
        !isNaN(extent[0]) &&
        !isNaN(extent[1]) &&
        !isNaN(extent[2]) &&
        !isNaN(extent[3]) &&
        HsMapService.map
      ) {
        HsMapService.map.getView().fit(extent, HsMapService.map.getSize());
      } else {
        const error = 'Compostion extent invalid! Map extent wont be changed';
        $log.warn(error);
        me.createErrorDialog(error);
      }
      const layers = await me.jsonToLayers(obj);
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
        default:
          respError.title = 'Unknown error happened while loading composition';
          respError.abstract = response.error.toString();
      }
      console.warn(response.error);
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
    jsonToLayers: async function (j) {
      const layers = [];
      // debugger;
      if (j) {
        if (j.data) {
          j = j.data;
        }
        if (!j.layers) {
          return layers;
        }
        for (const lyr_def of j.layers) {
          if (lyr_def.className){
            const layer = await me.jsonToLayer(lyr_def);
            if (angular.isUndefined(layer)) {
              const error = `Was not able to parse layer from composition: ${lyr_def.title}`;
              $log.warn(error);
              me.createErrorDialog(error);
            } else {
              layers.push(layer);
            }
          }
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
          case 'HSLayers.Layer.WMTS':
            return HsCompositionsLayerParserService.createWMTSLayer(lyr_def);
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
