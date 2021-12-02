import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import * as xml2Json from 'xml-js';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {transform, transformExtent} from 'ol/proj';

import {DuplicateHandling, HsMapService} from '../map/map.service';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCompositionsLayerParserService} from './layer-parser/layer-parser.service';
import {HsCompositionsWarningDialogComponent} from './dialogs/warning-dialog.component';
import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerManagerService} from '../layermanager/layermanager.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsToastService} from '../layout/toast/toast.service';

import {
  getFromComposition,
  getTitle,
  setMetadata,
} from '../../common/layer-extensions';
import {parseExtent, transformExtentValue} from '../../common/extent-utils';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsParserService {
  /**
   * @public
   * @type {string} null
   * @description Stores current composition URL if there is one or NULL
   */
  composition_loaded = null;
  /**
   * @public
   * @type {boolean} null
   * @description Stores whether current composition was edited (for composition changes, saving etc.)
   */
  composition_edited = false;
  /**
   * @public
   * @type {string} ""
   * @description Stores title of current composition
   */
  current_composition_title = '';
  current_composition_url: string;
  current_composition_workspace: string;
  constructor(
    public HsMapService: HsMapService,
    public HsConfig: HsConfig,
    private $http: HttpClient,
    public HsUtilsService: HsUtilsService,
    public HsCompositionsLayerParserService: HsCompositionsLayerParserService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayoutService: HsLayoutService,
    public $log: HsLogService,
    public HsEventBusService: HsEventBusService,
    public HsLanguageService: HsLanguageService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    public HsLayerManagerService: HsLayerManagerService,
    public hsToastService: HsToastService
  ) {}

  /**
   * @public
   * @param {string} url Url of selected composition
   * @param {boolean} overwrite Whether overwrite current composition in map -
   * remove all layers from maps which originate from composition (if not pasted, it counts as "true")
   * @param {Function} callback Optional function which should be called when composition is successfully loaded
   * @param {Function} pre_parse Optional function for pre-parsing loaded data about composition to accepted format
   * @returns {Promise}
   * @description Load selected composition from server, parse it and add layers to map.
   * Optionally (based on app config) may open layer manager panel
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
    const options = {};
    if (url.includes('.wmc')) {
      pre_parse = (res) => this.parseWMC(res);
      options['responseType'] = 'text';
    }
    options['withCredentials'] = url.includes(
      this.HsCommonEndpointsService?.endpoints.filter(
        (ep) => ep.type == 'layman'
      )[0]?.url
    );
    const data: any = await this.$http.get(url, options).toPromise();
    if (data?.file) {
      // Layman composition wrapper
      return this.loadUrl(data.file.url, overwrite, callback, pre_parse);
    }
    this.loaded(data, pre_parse, url, overwrite, callback);
  }

  async loaded(
    response,
    pre_parse,
    url,
    overwrite: boolean,
    callback
  ): Promise<void> {
    this.HsEventBusService.compositionLoading.next(response);
    if (this.checkLoadSuccess(response)) {
      this.composition_loaded = url;
      if (this.HsUtilsService.isFunction(pre_parse)) {
        response = pre_parse(response);
      }
      response.workspace = this.current_composition_workspace;
      /*
      Response might contain {data:{abstract:...}} or {abstract:}
      directly. If there is data object,
      that means composition is enclosed in
      container which itself might contain title or extent
      properties */
      await this.loadCompositionObject(
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
    const compositionJSON: any = {
      current_base_layer: {
        title: 'Composite_base_layer',
      },
      extent: [
        parseFloat(res.General.BoundingBox._attributes['maxx']),
        parseFloat(res.General.BoundingBox._attributes['maxy']),
        parseFloat(res.General.BoundingBox._attributes['minx']),
        parseFloat(res.General.BoundingBox._attributes['miny']),
      ],
      layers: [],
      units: res.LayerList.Layer[0].Extension['ol:units']._text,
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
        className: 'HSLayers.Layer.WMS',
        dimensions: {},
        legends: [''],
        maxResolution: null,
        metadata: {},
        minResolution: 0,
        opacity: layer.Extension['ol:opacity']
          ? parseFloat(layer.Extension['ol:opacity']._text)
          : 1,
        showInLayerManager: layer.Extension['ol:displayInLayerSwitcher']._text,
        params: {
          FORMAT: 'image/png',

          INFO_FORMAT: 'text/html',
          LAYERS: layer.Name._text,
          VERSION: layer.Server._attributes.version,
        },
        ratio: 1.5,
        singleTile: true,
        title: layer.Extension['hsl:layer_title']._text,
        url: layer.Server.OnlineResource._attributes['xlink:href'],
        visibility: true,
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
  async loadCompositionObject(
    obj,
    overwrite: boolean,
    titleFromContainer?: boolean,
    extentFromContainer?: string | Array<number>
  ): Promise<void> {
    if (overwrite == undefined || overwrite == true) {
      this.removeCompositionLayers();
    }
    this.HsEventBusService.currentComposition.next(obj);
    this.current_composition_title = titleFromContainer || obj.title;
    const possibleExtent = extentFromContainer || obj.extent;
    if (possibleExtent !== undefined) {
      const extent = parseExtent(possibleExtent);
      if (
        (extent[0][0] < -90 && extent[0][1] < -180) ||
        (extent[1][0] > 90 && extent[1][1] > 180)
      ) {
        this.loadWarningBootstrap(extent);
      } else {
        this.HsMapService.fitExtent(
          transformExtentValue(extent, this.HsMapService.getCurrentProj())
        );
      }
    }

    const layers = await this.jsonToLayers(obj);
    if (layers?.length > 0) {
      layers.forEach((lyr) => {
        this.HsMapService.addLayer(
          lyr as Layer<Source>,
          DuplicateHandling.RemoveOriginal
        );
      });
      this.HsLayerManagerService.updateLayerListPositions();
    }

    if (obj.current_base_layer) {
      this.HsMapService.map.getLayers().forEach((lyr: Layer<Source>) => {
        if (
          getTitle(lyr) == obj.current_base_layer.title ||
          getTitle(lyr) == obj.current_base_layer
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
   * @public
   * @description Remove all layers gained from composition from map
   */
  removeCompositionLayers(): void {
    const to_be_removed = [];
    this.HsMapService.getLayersArray().forEach((lyr) => {
      if (getFromComposition(lyr)) {
        to_be_removed.push(lyr);
      }
    });
    while (to_be_removed.length > 0) {
      this.HsMapService.map.removeLayer(to_be_removed.shift());
    }
  }

  /**
   * @public
   * @param {string} url Url to composition info
   * @returns {object} Object containing composition info
   * @description Send Ajax request to selected server to gain information about composition
   */
  async loadInfo(url: string): Promise<any> {
    url = url.replace(/&amp;/g, '&');
    url = this.HsUtilsService.proxify(url);
    let options;
    options = {responseType: 'json'};
    let response;
    if (url.endsWith('.wmc')) {
      options = {responseType: 'text'};
      response = await this.$http.get(url, options).toPromise();
      response = this.parseMickaWmcInfo(response);
    } else {
      response = await this.$http.get(url, options).toPromise();
    }
    return response.data || response;
  }
  parseMickaWmcInfo(response): any {
    let res: any = xml2Json.xml2js(response, {compact: true});
    const layersInfo = res.ViewContext.LayerList?.Layer;
    const keywordsInfo = res.ViewContext.General.KeywordList?.Keyword;
    res = res.ViewContext.General;
    const infoDetails: any = {
      title: res.Title?._text,
      abstract: res.Abstract?._text,
      srs: res.BoundingBox?._attributes?.SRS,
      extent: [
        parseFloat(res.BoundingBox?._attributes['maxx']),
        parseFloat(res.BoundingBox?._attributes['maxy']),
        parseFloat(res.BoundingBox?._attributes['minx']),
        parseFloat(res.BoundingBox?._attributes['miny']),
      ],
      contactAddress: {
        address: res.ContactInformation?.ContactAddress?.Address?._text,
        city: res.ContactInformation?.ContactAddress?.City?._text,
        country: res.ContactInformation?.ContactAddress?.Country?._text,
        postalCode: res.ContactInformation?.ContactAddress?.PostCode?._text,
        stateOrProvince:
          res.ContactInformation?.ContactAddress?.StateOrProvince?._text,
      },
      contactPersonPrimary: {
        organization:
          res.ContactInformation?.ContactPersonPrimary?.ContactOrganization
            ?._text,
        person:
          res.ContactInformation?.ContactPersonPrimary?.ContactPerson?._text,
        phone: res.ContactInformation?.ContactVoiceTelephone?._text,
        email: res.ContactInformation?.ContactElectronicMailAddress?._text,
      },
    };
    if (layersInfo !== undefined) {
      infoDetails.layers = layersInfo.map((lyr) => {
        return {
          title: lyr.Title?._text,
        };
      });
    }
    if (keywordsInfo !== undefined) {
      Array.isArray(keywordsInfo)
        ? (infoDetails.keywords = keywordsInfo.map((kw) => kw._text))
        : (infoDetails.keywords = keywordsInfo._text);
    }
    return infoDetails;
  }

  loadWarningBootstrap(extent): void {
    this.HsDialogContainerService.create(HsCompositionsWarningDialogComponent, {
      extent: extent,
      composition_title: this.current_composition_title,
      message: this.HsLanguageService.getTranslationIgnoreNonExisting(
        'COMPOSITIONS.dialogWarning',
        'outOfBounds'
      ),
    });
  }
  /**
   * @public
   * @param {object} j Composition object with Layers
   * @returns {Array} Array of created layers
   * @description Parse composition object to extract individual layers and add them to map
   */
  async jsonToLayers(j): Promise<Layer<Source>[]> {
    const layers = [];
    if (j.data) {
      j = j.data;
    }
    for (const lyr_def of j.layers) {
      const layer = await this.jsonToLayer(lyr_def);
      if (layer == undefined) {
        if (lyr_def.protocol.format != 'hs.format.externalWFS') {
          this.$log.warn(
            'Was not able to parse layer from composition',
            lyr_def
          );
          this.hsToastService.createToastPopupMessage(
            this.HsLanguageService.getTranslation(
              'COMPOSITIONS.errorWhileCreatingLayerFromComposition'
            ),
            this.HsLanguageService.getTranslation(
              'COMPOSITIONS.notAbleToParseLayerFromComposition'
            ) + lyr_def.title,
            {
              disableLocalization: true,
              serviceCalledFrom: 'HsCompositionsParserService',
            }
          );
        }
      } else {
        layers.push(layer);
      }
    }
    return layers;
  }

  /**
   * @public
   * @param {object} lyr_def Layer to be created (encapsulated in layer definition object)
   * @returns {Function} Parser function to create layer (using config_parsers service)
   * @description Select correct layer parser for input data based on layer "className" property (HSLayers.Layer.WMS/OpenLayers.Layer.Vector)
   */
  async jsonToLayer(lyr_def): Promise<any> {
    let resultLayer;
    switch (lyr_def.className) {
      case 'HSLayers.Layer.WMS':
      case 'WMS':
        resultLayer =
          this.HsCompositionsLayerParserService.createWmsLayer(lyr_def);
        break;
      case 'HSLayers.Layer.WMTS':
        resultLayer =
          this.HsCompositionsLayerParserService.createWMTSLayer(lyr_def);
        break;
      case 'ArcGISRest':
        resultLayer =
          this.HsCompositionsLayerParserService.createArcGISLayer(lyr_def);
        break;
      case 'XYZ':
        resultLayer =
          this.HsCompositionsLayerParserService.createXYZLayer(lyr_def);
        break;
      case 'StaticImage':
        resultLayer =
          this.HsCompositionsLayerParserService.createStaticImageLayer(lyr_def);
        break;
      case 'OpenLayers.Layer.Vector':
      case 'Vector':
      case 'hs.format.LaymanWfs':
        if (lyr_def.protocol?.format == 'hs.format.externalWFS') {
          this.HsCompositionsLayerParserService.createWFSLayer(lyr_def);
        } else {
          resultLayer =
            await this.HsCompositionsLayerParserService.createVectorLayer(
              lyr_def
            );
        }
        break;
      default:
        const existing = this.HsMapService.getLayersArray().find(
          (l) => getTitle(l as Layer<Source>) == lyr_def.title
        );
        if (existing != undefined) {
          existing.setZIndex(undefined);
          return existing;
        }
        return;
    }
    if (resultLayer) {
      setMetadata(resultLayer, lyr_def.metadata);
    }
    return resultLayer;
  }
}
