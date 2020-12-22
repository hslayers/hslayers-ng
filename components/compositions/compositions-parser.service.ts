import * as xml2Json from 'xml-js';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {transform, transformExtent} from 'ol/proj';

import {HsCompositionsLayerParserService} from './layer-parser/layer-parser.service';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsParserService {
  /**
   * @name HsCompositionsParserService#composition_loaded
   * @public
   * @type {string} null
   * @description Stores current composition URL if there is one or NULL
   */
  composition_loaded = null;
  /**
   * @name HsCompositionsParserService#composition_edited
   * @public
   * @type {boolean} null
   * @description Stores whether current composition was edited (for composition changes, saving etc.)
   */
  composition_edited = false;
  /**
   * @name HsCompositionsParserService#current_composition_title
   * @public
   * @type {string} ""
   * @description Stores title of current composition
   */
  current_composition_title = '';
  current_composition_url: string;
  current_composition: any;

  constructor(
    public HsMapService: HsMapService,
    public HsConfig: HsConfig,
    private $http: HttpClient,
    public HsUtilsService: HsUtilsService,
    public HsCompositionsLayerParserService: HsCompositionsLayerParserService,
    public HsLayoutService: HsLayoutService,
    public $log: HsLogService,
    public HsEventBusService: HsEventBusService
  ) {}

  /**
   * @name HsCompositionsParserService#load
   * @public
   * @param {string} url Url of selected composition
   * @param {boolean} overwrite Whether overwrite current composition in map - remove all layers from maps which originate from composition (if not pasted, it counts as "true")
   * @param {Function} callback Optional function which should be called when composition is successfully loaded
   * @param {Function} pre_parse Optional function for pre-parsing loaded data about composition to accepted format
   * @returns {Promise}
   * @description Load selected composition from server, parse it and add layers to map. Optionally (based on app config) may open layer manager panel
   */
  async loadUrl(
    url: string,
    overwrite?: boolean,
    callback?,
    pre_parse?
  ): Promise<void> {
    this.current_composition_url = url;
    url = url.replace(/&amp;/g, '&');
    url = this.HsUtilsService.proxify(url);
    let options;
    if (url.includes('.wmc')) {
      pre_parse = (res) => this.parseWMC(res);
      options = {responseType: 'text'};
    }
    const data: any = await this.$http.get(url, options).toPromise();
    if (data?.file) {
      // Layman composition wrapper
      return this.loadUrl(data.file.url, overwrite, callback, pre_parse);
    }
    this.loaded(data, pre_parse, url, overwrite, callback);
  }

  loaded(response, pre_parse, url, overwrite: boolean, callback): void {
    this.HsEventBusService.compositionLoading.next(response);
    if (this.checkLoadSuccess(response)) {
      this.composition_loaded = url;
      if (this.HsUtilsService.isFunction(pre_parse)) {
        response = pre_parse(response);
      }
      /*
      Response might contain {data:{abstract:...}} or {abstract:}
      directly. If there is data object,
      that means composition is enclosed in
      container which itself might contain title or extent
      properties */
      this.loadCompositionObject(
        response.data || response,
        overwrite,
        response.title,
        response.extent
      );
      this.finalizeCompositionLoading(response);
      if (this.HsUtilsService.isFunction(callback)) {
        callback();
      }
    } else {
      this.raiseCompositionLoadError(response);
    }
  }

  parseWMC(response: string): any {
    let res: any = xml2Json.xml2js(response, {compact: true});
    res = res.ViewContext;
    //console.log(res);
    const compositionJSON: any = {
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
      id: res._attributes.id,
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
        'show_in_manager': layer.Extension['ol:displayInLayerSwitcher']._text,
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
    const composition = {data: {}};
    composition.data = compositionJSON;
    return composition;
  }

  checkLoadSuccess(response): boolean {
    return (
      response.success == true /*micka*/ ||
      (response.success == undefined /*layman*/ &&
        response.name !== undefined) ||
      response.includes('LayerList') /*.wmc micka*/
    );
  }

  loadCompositionObject(
    obj,
    overwrite: boolean,
    titleFromContainer?: boolean,
    extentFromContainer?: string | Array<number>
  ): void {
    if (overwrite == undefined || overwrite == true) {
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

  finalizeCompositionLoading(responseData): void {
    if (this.HsConfig.open_lm_after_comp_loaded) {
      this.HsLayoutService.setMainPanel('layermanager');
    }

    this.composition_edited = false;
    this.HsEventBusService.compositionLoads.next(responseData);
  }

  raiseCompositionLoadError(response): void {
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
   * @name HsCompositionsParserService#removeCompositionLayers
   * @public
   * @description Remove all layers gained from composition from map
   */
  removeCompositionLayers(): void {
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
   * @name HsCompositionsParserService#loadInfo
   * @public
   * @param {string} url Url to composition info
   * @returns {object} Object containing composition info
   * @description Send Ajax request to selected server to gain information about composition
   */
  async loadInfo(url: string): Promise<any> {
    url = url.replace(/&amp;/g, '&');
    url = this.HsUtilsService.proxify(url);
    const response: any = await this.$http.get(url).toPromise();
    return response.data || response;
  }

  parseExtent(b: string | Array<number>): Array<number> {
    let boundArray;
    if (!b) {
      return;
    }
    if (typeof b == 'string') {
      boundArray = b.split(' ');
    } else {
      boundArray = b;
    }
    let first_pair = [parseFloat(boundArray[0]), parseFloat(boundArray[1])];
    let second_pair = [parseFloat(boundArray[2]), parseFloat(boundArray[3])];
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
    for (const lyr_def of j.layers) {
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
   * @name HsCompositionsParserService#jsonToLayer
   * @public
   * @param {object} lyr_def Layer to be created (encapsulated in layer definition object)
   * @returns {Function} Parser function to create layer (using config_parsers service)
   * @description Select correct layer parser for input data based on layer "className" property (HSLayers.Layer.WMS/OpenLayers.Layer.Vector)
   */
  jsonToLayer(lyr_def) {
    let resultLayer;
    switch (lyr_def.className) {
      case 'HSLayers.Layer.WMS':
      case 'WMS':
        resultLayer = this.HsCompositionsLayerParserService.createWmsLayer(
          lyr_def
        );
        break;
      case 'ArcGISRest':
        resultLayer = this.HsCompositionsLayerParserService.createArcGISLayer(
          lyr_def
        );
        break;
      case 'XYZ':
        resultLayer = this.HsCompositionsLayerParserService.createXYZLayer(
          lyr_def
        );
        break;
      case 'StaticImage':
        resultLayer = this.HsCompositionsLayerParserService.createStaticImageLayer(
          lyr_def
        );
        break;
      case 'OpenLayers.Layer.Vector':
      case 'Vector':
      case 'hs.format.LaymanWfs':
        resultLayer = this.HsCompositionsLayerParserService.createVectorLayer(
          lyr_def
        );
        break;
      default:
        const existing = this.HsMapService.getLayersArray().find(
          (l) => l.get('title') == lyr_def.title
        );
        if (existing != undefined) {
          existing.setZIndex(undefined);
          return existing;
        }
        return;
    }
    if (resultLayer) {
      resultLayer.set('metadata', lyr_def.metadata);
    }
    return resultLayer;
  }
}
