import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {transform} from 'ol/proj';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsParserService {
  /**
   * @ngdoc property
   * @name HsCompositionsParserService#composition_loaded
   * @public
   * @type {string} null
   * @description Stores current composition URL if there is one or NULL
   */
  composition_loaded = null;
  /**
   * @ngdoc property
   * @name HsCompositionsParserService#composition_edited
   * @public
   * @type {boolean} null
   * @description Stores whether current composition was edited (for composition changes, saving etc.)
   */
  composition_edited = false;
  /**
   * @ngdoc property
   * @name HsCompositionsParserService#current_composition_title
   * @public
   * @type {string} ""
   * @description Stores title of current composition
   */
  current_composition_title = '';
  current_composition_url: string;
  current_composition: any;

  constructor(
    private HsMapService: HsMapService,
    private HsConfig: HsConfig,
    private $http: HttpClient,
    private HsUtilsService: HsUtilsService,
    private HsCompositionsLayerParserService: HsCompositionsLayerParserService,
    private HsLayoutService: HsLayoutService,
    private $log: HsLogService,
    private HsEventBusService: HsEventBusService
  ) {}

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
  loadUrl(url, overwrite, callback, pre_parse) {
    return new Promise((resolve, reject) => {
      this.current_composition_url = url;
      url = url.replace(/&amp;/g, '&');
      url = this.HsUtilsService.proxify(url);
      this.$http({url: url, overwrite, callback, pre_parse})
        .then(
          (response) => this.loaded(response),
          (err) => {
            //Do nothing
          }
        )
        .then(() => {
          resolve();
        });
    });
  }

  loaded(response) {
    /**
     * @ngdoc event
     * @name HsCompositionsParserService#compositions.composition_loading
     * @eventType broadcast on $rootScope
     * @description Fires when composition is downloaded from server and parsing begins
     */
    this.HsEventBusService.compositionLoading.next(response.data);
    if (this.checkLoadSuccess(response)) {
      this.composition_loaded = response.config.url;
      if (this.HsUtilsService.isFunction(response.config.pre_parse)) {
        response = response.config.pre_parse(response.data);
      }
      /*
                    Response might contain {data:{abstract:...}} or {abstract:}
                    directly. If there is data object,
                    that means composition is enclosed in
                    container which itself might contain title or extent
                    properties */
      this.loadCompositionObject(
        response.data.data || response.data,
        response.config.overwrite,
        response.title,
        response.extent
      );
      this.finalizeCompositionLoading(response.data);
      if (this.HsUtilsService.isFunction(response.config.callback)) {
        response.config.callback();
      }
    } else {
      this.raiseCompositionLoadError(response.data);
    }
  }

  checkLoadSuccess(response) {
    return (
      response.data.success == true /*micka*/ ||
      (response.data.success == undefined /*layman*/ &&
        response.data.name !== undefined)
    );
  }

  loadCompositionObject(
    obj,
    overwrite,
    titleFromContainer,
    extentFromContainer
  ) {
    if (angular.isUndefined(overwrite) || overwrite == true) {
      this.removeCompositionLayers();
    }
    this.current_composition = obj;
    this.current_composition_title = titleFromContainer || obj.title;
    const possibleExtent = extentFromContainer || obj.extent;
    if (possibleExtent !== undefined) {
      this.HsMapService.map
        .getView()
        .fit(this.parseExtent(possibleExtent), this.HsMapService.map.getSize());
    }

    const layers = this.jsonToLayers(obj);
    layers.forEach((lyr) => {
      this.HsMapService.addLayer(lyr, true);
    });

    if (obj.current_base_layer) {
      this.HsMapService.map.getLayers().forEach((lyr) => {
        if (
          lyr.get('title') == obj.current_base_layer.title ||
          lyr.get('title') == obj.current_base_layer
        ) {
          lyr.setVisible(true);
        }
      });
    }
  }

  finalizeCompositionLoading(responseData) {
    if (this.HsConfig.open_lm_after_comp_loaded) {
      this.HsLayoutService.setMainPanel('layermanager');
    }

    this.composition_edited = false;
    /**
     * @ngdoc event
     * @name HsCompositionsParserService#compositions.composition_loaded
     * @description Fires when composition is loaded or not loaded with Error message
     */
    this.HsEventBusService.compositionLoads.next(responseData);
  }

  raiseCompositionLoadError(response) {
    const respError: any = {};
    respError.error = response.error;
    switch (response.error) {
      case 'no data':
        respError.title = 'Composition not found';
        respError.abstract =
          'Sorry but composition was deleted or incorrectly saved';
        break;
      default:
        respError.title = 'Composition not loaded';
        respError.abstract =
          'We are sorry, but composition was not loaded due to some error';
        break;
    }
    this.HsEventBusService.compositionLoads.next(respError);
  }

  /**
   * @ngdoc method
   * @name HsCompositionsParserService#removeCompositionLayers
   * @public
   * @description Remove all layers gained from composition from map
   */
  removeCompositionLayers() {
    const to_be_removed = [];
    this.HsMapService.map.getLayers().forEach((lyr) => {
      if (lyr.get('from_composition')) {
        to_be_removed.push(lyr);
      }
    });
    while (to_be_removed.length > 0) {
      this.HsMapService.map.removeLayer(to_be_removed.shift());
    }
  }

  /**
   * @ngdoc method
   * @name HsCompositionsParserService#loadInfo
   * @public
   * @param {string} url Url to composition info
   * @param cb
   * @returns {object} Object containing composition info
   * @description Send Ajax request to selected server to gain information about composition
   */
  loadInfo(url, cb) {
    let info = {};
    url = url.replace(/&amp;/g, '&');
    url = this.HsUtilsService.proxify(url);
    this.$http({url: url}).then(
      (response) => {
        info = response.data.data || response.data;
        /**
         * @ngdoc event
         * @name HsCompositionsParserService#compositions.composition_info_loaded
         * @eventType broadcast on $rootScope
         * @description Fires when metadata about selected composition are loaded
         */
        this.$rootScope.$broadcast(
          'compositions.composition_info_loaded',
          response.data
        );
        cb(info);
      },
      (err) => {
        //Nothing
      }
    );
  }

  parseExtent(b) {
    if (typeof b == 'string') {
      b = b.split(' ');
    }
    let first_pair = [parseFloat(b[0]), parseFloat(b[1])];
    let second_pair = [parseFloat(b[2]), parseFloat(b[3])];
    first_pair = transform(
      first_pair,
      'EPSG:4326',
      this.HsMapService.map.getView().getProjection()
    );
    second_pair = transform(
      second_pair,
      'EPSG:4326',
      this.HsMapService.map.getView().getProjection()
    );
    return [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
  }

  /**
   * @ngdoc method
   * @name HsCompositionsParserService#jsonToLayers
   * @public
   * @param {object} j Composition object with Layers
   * @returns {Array} Array of created layers
   * @description Parse composition object to extract individual layers and add them to map
   */
  jsonToLayers(j) {
    const layers = [];
    if (j.data) {
      j = j.data;
    }
    for (let i = 0; i < j.layers.length; i++) {
      const lyr_def = j.layers[i];
      const layer = this.jsonToLayer(lyr_def);
      if (layer == undefined) {
        this.$log.warn('Was not able to parse layer from composition', lyr_def);
      } else {
        layers.push(layer);
      }
    }
    return layers;
  }

  /**
   * @ngdoc method
   * @name HsCompositionsParserService#jsonToLayer
   * @public
   * @param {object} lyr_def Layer to be created (encapsulated in layer definition object)
   * @returns {Function} Parser function to create layer (using config_parsers service)
   * @description Select correct layer parser for input data based on layer "className" property (HSLayers.Layer.WMS/OpenLayers.Layer.Vector)
   */
  jsonToLayer(lyr_def) {
    switch (lyr_def.className) {
      case 'HSLayers.Layer.WMS':
      case 'WMS':
        return this.HsCompositionsLayerParserService.createWmsLayer(lyr_def);
      case 'ArcGISRest':
        return this.HsCompositionsLayerParserService.createArcGISLayer(lyr_def);
      case 'XYZ':
        return this.HsCompositionsLayerParserService.createXYZLayer(lyr_def);
      case 'StaticImage':
        return this.HsCompositionsLayerParserService.createStaticImageLayer(
          lyr_def
        );
      case 'OpenLayers.Layer.Vector':
      case 'Vector':
        return this.HsCompositionsLayerParserService.createVectorLayer(lyr_def);
      default:
        return;
    }
  }
}
