import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import * as xml2Json from 'xml-js';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {lastValueFrom} from 'rxjs';
import {transformExtent} from 'ol/proj';

import {CswLayersDialogComponent} from './dialogs/csw-layers-dialog/csw-layers-dialog.component';
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
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService, generateUuid} from '../utils/utils.service';
import {getLaymanFriendlyLayerName} from '../save-map/layman-utils';
import {
  getTitle,
  setMetadata,
  setSwipeSide,
} from '../../common/layer-extensions';
import {parseExtent, transformExtentValue} from '../../common/extent-utils';
import {servicesSupportedByUrl} from '../add-data/url/services-supported.const';

class HsCompositionsParserParams {
  /**
   * @public
   * Stores current composition URL if there is one or NULL
   */
  composition_loaded = null;
  /**
   * @public
   * Stores whether current composition was edited (for composition changes, saving etc.)
   */
  composition_edited = false;
  /**
   * @public
   * Stores title of current composition
   */
  current_composition_title = '';
  current_composition_url: string;
  current_composition_workspace: string;
  loadingOptions = {
    suspendZoomingToExtent: false,
    suspendPanelChange: false,
  };
}
@Injectable({
  providedIn: 'root',
})
export class HsCompositionsParserService {
  apps: {
    [id: string]: HsCompositionsParserParams;
  } = {default: new HsCompositionsParserParams()};
  constructor(
    private hsMapService: HsMapService,
    private hsConfig: HsConfig,
    private $http: HttpClient,
    private hsUtilsService: HsUtilsService,
    private hsCompositionsLayerParserService: HsCompositionsLayerParserService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLayoutService: HsLayoutService,
    private $log: HsLogService,
    private hsEventBusService: HsEventBusService,
    private hsLanguageService: HsLanguageService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsLayerManagerService: HsLayerManagerService,
    private hsToastService: HsToastService
  ) {}

  /**
   * Get the params saved by the composition parser service for the current app
   * @param app - App identifier
   */
  get(app: string): HsCompositionsParserParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsCompositionsParserParams();
    }
    return this.apps[app ?? 'default'];
  }
  /**
   * @public
   * Load selected composition from server, parse it and add layers to map.
   * Optionally (based on app config) may open layer manager panel
   * @param url - Url of selected composition
   * @param app - App identifier
   * @param overwrite - Whether overwrite current composition in map -
   * remove all layers from maps which originate from composition (if not pasted, it counts as "true")
   * @param callback - Optional function which should be called when composition is successfully loaded
   * @param pre_parse - Optional function for pre-parsing loaded data about composition to accepted format
   */
  async loadUrl(
    url: string | any, //CSW record object
    app: string,
    overwrite?: boolean,
    callback?,
    pre_parse?
  ): Promise<void> {
    if (typeof url !== 'string') {
      pre_parse = (res) => this.parseCSW(res);
      url.success = true;
      url.app = app;
      this.loaded(url, pre_parse, url, overwrite, callback, app);
      return;
    }
    this.get(app).current_composition_url = url;
    url = url.replace(/&amp;/g, '&');
    url = this.hsUtilsService.proxify(url, app);
    const options = {};
    if (url.includes('.wmc')) {
      pre_parse = (res) => this.parseWMC(res);
      options['responseType'] = 'text';
    }
    options['withCredentials'] = url.includes(
      this.hsCommonEndpointsService?.endpoints.find((ep) => ep.type == 'layman')
        ?.url
    );
    const data: any = await lastValueFrom(this.$http.get(url, options)).catch(
      (e) => {
        this.raiseCompositionLoadError(e, app);
      }
    );
    if (data) {
      if (data.file) {
        // Layman composition wrapper
        return this.loadUrl(data.file.url, app, overwrite, callback, pre_parse);
      }
      this.loaded(data, pre_parse, url, overwrite, callback, app);
    }
  }

  /**
   * Check if the response holds the composition data and try to load the composition object
   * @param response - Response from http get request requesting composition data
   * @param pre_parse - Function for pre-parsing loaded data about composition to accepted format
   * @param url - Url of selected composition
   * @param overwrite - Whether overwrite current composition in map -
   * remove all layers from maps which originate from composition (if not pasted, it counts as "true")
   * @param callback - Function which should be called when composition is successfully loaded
   * @param app - App identifier
   */
  async loaded(
    response,
    pre_parse,
    url,
    overwrite: boolean,
    callback,
    app: string
  ): Promise<void> {
    this.hsEventBusService.compositionLoading.next(response);
    const appRef = this.get(app);
    if (this.checkLoadSuccess(response)) {
      appRef.composition_loaded = url;
      if (this.hsUtilsService.isFunction(pre_parse)) {
        response = await pre_parse({response, app});
      }
      response.workspace = appRef.current_composition_workspace;
      /*
      Response might contain {data:{abstract:...}} or {abstract:}
      directly. If there is data object,
      that means composition is enclosed in
      container which itself might contain title or extent
      properties */
      const loaded = await this.loadCompositionObject(
        response.data || response,
        overwrite && !pre_parse, //For CSW comps we need to wait for dialog to resolve before removing existing layers
        app,
        response.title,
        response.extent
      );
      //Don't trigger compositionLoads when loading basemapCompostion
      if (loaded && !response.basemapCompostion) {
        this.finalizeCompositionLoading(response, app);
      }
      if (this.hsUtilsService.isFunction(callback)) {
        callback();
      }
    } else {
      this.raiseCompositionLoadError(response, app);
    }
  }

  /**
   * Parse url from CSW compostion format layer/service
   */
  parseCSWLayer(layer) {
    if (!layer.online) {
      return;
    }
    for (const link of layer.online) {
      const type = servicesSupportedByUrl.find((type) =>
        link.protocolUri.toLowerCase().includes(type)
      );
      if (type) {
        return {
          type: type,
          title: layer.title,
          url: link.url,
          id: generateUuid(),
        };
      }
    }
  }

  /**
   * Parse CSW composition record extracting layers
   */
  getCSWLayers(record) {
    const layers = [];
    const services = [];
    for (const layer of record.operatesOn) {
      const layerObject = this.parseCSWLayer(layer);
      if (layerObject) {
        (layerObject.url.includes('LAYERS=') ? layers : services).push(
          layerObject
        );
      }
    }
    return {layers, services};
  }

  async parseCSW({response, app}) {
    const composition = {};

    composition['name'] = getLaymanFriendlyLayerName(response.title);
    composition['title'] = response.title;
    composition['scale'] = 1; //not nice
    composition['schema_version'] = '2.0.0'; //not nice
    composition['title'] = response.title;
    composition['abstract'] = response.abstract;

    const operatesOn = this.getCSWLayers(response);
    composition['layers'] = operatesOn['layers'];
    composition['services'] = operatesOn['services'];

    if (composition['layers']?.length > 0) {
      composition['layers'].filter((l) => {
        l.className = l.type == 'wms' ? 'HSLayers.Layer.WMS' : null;
        l.params = {
          FORMAT: 'image/png',
          INFO_FORMAT: 'text/html',
          LAYERS: l.url
            .split('&')
            .find((p) => p.includes('LAYERS'))
            .split('=')[1],
          VERSION: l.url
            .split('&')
            .find((p) => p.includes('VERSION'))
            .split('=')[1],
        };
        l.url = l.url.split('?')[0];
        return l.className;
      });
    }

    // "user": {
    //   "email": "leitnerfilip@gmail.com",
    //   "name": "Filip Leitner"
    // }
    return composition;
  }

  /**
   * Parse WMC to JSON object
   * @param response - Response from http get request requesting composition data
   */
  parseWMC({response, app}): any {
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

  /**
   * Check if the response indicates a successful data request
   * @param response - Response from http get request requesting composition data
   */
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
    app: string = 'default',
    titleFromContainer?: boolean,
    extentFromContainer?: string | Array<number>
  ): Promise<boolean> {
    if (overwrite == undefined || overwrite == true) {
      this.hsMapService.removeCompositionLayers(overwrite == true, app);
    }
    this.hsEventBusService.currentComposition.next(obj); //Doesnt seems to be used
    this.get(app).current_composition_title = titleFromContainer || obj.title;
    const possibleExtent = extentFromContainer || obj.extent;
    if (
      possibleExtent !== undefined &&
      !this.get(app).loadingOptions.suspendZoomingToExtent
    ) {
      const extent = parseExtent(possibleExtent);
      if (
        (extent[0][0] < -90 && extent[0][1] < -180) ||
        (extent[1][0] > 90 && extent[1][1] > 180)
      ) {
        this.loadWarningBootstrap(extent, app);
      } else {
        this.hsMapService.fitExtent(
          transformExtentValue(extent, this.hsMapService.getCurrentProj(app)),
          app
        );
      }
    }

    //CSW serviceType compostitions
    const layers = await this.jsonToLayers(obj, app);

    const confirmed = obj.services
      ? await this.hsDialogContainerService
          .create(
            CswLayersDialogComponent,
            {app: app, services: obj.services, layers: obj.layers},
            app
          )
          .waitResult()
      : true;

    if (confirmed) {
      if (layers?.length > 0) {
        layers.forEach((lyr) => {
          this.hsMapService.addLayer(
            lyr as Layer<Source>,
            app,
            DuplicateHandling.RemoveOriginal
          );
        });
        this.hsLayerManagerService.updateLayerListPositions(app);
      }

      if (obj.current_base_layer) {
        this.hsMapService
          .getMap(app)
          .getLayers()
          .forEach((lyr: Layer<Source>) => {
            if (
              getTitle(lyr) == obj.current_base_layer.title ||
              getTitle(lyr) == obj.current_base_layer
            ) {
              const layerDescriptor =
                this.hsLayerManagerService.getLayerDescriptorForOlLayer(
                  lyr,
                  true,
                  app
                );
              this.hsLayerManagerService.changeBaseLayerVisibility(
                true,
                layerDescriptor,
                app
              );
            }
          });
      }

      return true;
    }
    return false;
  }

  /**
   * Finalize composition loading to the OL map
   * @param responseData - Response from http get request requesting composition data
   * @param app - App identifier
   */
  finalizeCompositionLoading(responseData, app: string): void {
    const configRef = this.hsConfig.get(app);
    const open_lm_after_comp_loaded = configRef.open_lm_after_comp_loaded;
    const appRef = this.get(app);
    if (
      (open_lm_after_comp_loaded === true ||
        open_lm_after_comp_loaded === undefined) &&
      !appRef.loadingOptions.suspendPanelChange
    ) {
      appRef.loadingOptions.suspendPanelChange = false;
      this.hsLayoutService.setMainPanel('layermanager', app);
    }
    appRef.composition_edited = false;
    this.hsEventBusService.compositionLoads.next({data: responseData, app});
  }

  /**
   * Create an error message in case of on an unsuccessful composition load
   * @param response - Response from http get request requesting composition data
   * @param app - App identifier
   */
  raiseCompositionLoadError(response, app: string): void {
    const respError: any = {};
    respError.error = response.error;
    switch (response.error) {
      case 'no data':
        respError.title = this.hsLanguageService.getTranslation(
          'COMPOSITIONS.compositionNotFound',
          undefined,
          app
        );
        respError.abstract = this.hsLanguageService.getTranslation(
          'COMPOSITIONS.sorryButComposition',
          undefined,
          app
        );
        break;
      default:
        respError.title = this.hsLanguageService.getTranslation(
          'COMPOSITIONS.compositionNotLoaded',
          undefined,
          app
        );
        respError.abstract = this.hsLanguageService.getTranslation(
          'COMPOSITIONS.weAreSorryBut',
          undefined,
          app
        );
        break;
    }
    this.hsEventBusService.compositionLoads.next({data: respError, app});
  }

  /**
   * @public
   * Send Ajax request to selected server to gain information about composition
   * @param url - Url to composition info
   * @param app - App identifier
   * @returns Object containing composition info
   */
  async loadInfo(url: string, app: string): Promise<any> {
    url = url.replace(/&amp;/g, '&');
    url = this.hsUtilsService.proxify(url, app);
    let options;
    options = {responseType: 'json'};
    let response;
    if (url.endsWith('.wmc')) {
      options = {responseType: 'text'};
      response = await lastValueFrom(this.$http.get(url, options));
      response = this.parseMickaWmcInfo(response);
    } else if (url.includes('GetRecordById')) {
      //CSW composition
      options = {responseType: 'text'};
      response = await lastValueFrom(this.$http.get(url, options));
      response = this.parseMickaCSWInfo(response);
    } else {
      response = await lastValueFrom(this.$http.get(url, options));
    }
    return response.data || response;
  }
  /**
   * Parse Micka datasource WMC info to JSON object
   * @param response - Response from http get request requesting composition data
   * @returns Object containing composition info
   */
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

  parseMickaCSWInfo(response: string) {
    const res: any = xml2Json.xml2js(response, {compact: true});
    console.log(res);
    const serviceIdentification =
      res['csw:GetRecordByIdResponse']['gmd:MD_Metadata'][
        'gmd:identificationInfo'
      ]['srv:SV_ServiceIdentification'];
    const layersInfo = serviceIdentification['srv:operatesOn'];

    const bbox =
      serviceIdentification['srv:extent']['gmd:EX_Extent'][
        'gmd:geographicElement'
      ]['gmd:EX_GeographicBoundingBox'];
    const infoDetails = {
      title:
        serviceIdentification['gmd:citation']['gmd:CI_Citation']['gmd:title'][
          'gco:CharacterString'
        ]._text,
      abstract:
        serviceIdentification['gmd:abstract']['gco:CharacterString']._text,
      extent: [
        parseFloat(bbox['gmd:eastBoundLongitude']['gco:Decimal']._text),
        parseFloat(bbox['gmd:southBoundLatitude']['gco:Decimal']._text),
        parseFloat(bbox['gmd:northBoundLatitude']['gco:Decimal']._text),
        parseFloat(bbox['gmd:westBoundLongitude']['gco:Decimal']._text),
      ],
    };
    if (layersInfo !== undefined) {
      infoDetails['layers'] = layersInfo.map((lyr) => {
        return {
          title: lyr._attributes['xlink:title'],
        };
      });
    }
    let keywordsInfo = serviceIdentification['gmd:descriptiveKeywords'];
    keywordsInfo = Array.isArray(keywordsInfo)
      ? this.getCSWKeyWords(keywordsInfo)
      : keywordsInfo['gmd:MD_Keywords']['gmd:keyword'];
    if (keywordsInfo) {
      Array.isArray(keywordsInfo);
      infoDetails['keywords'] = keywordsInfo.map(
        (kw) => kw['gco:CharacterString']._text
      );
    }
    return infoDetails;
  }

  getCSWKeyWords(keywordInfo) {
    let kw;
    for (const keywordObject of keywordInfo) {
      kw = keywordObject['gmd:MD_Keywords']['gmd:keyword'] ?? kw;
    }
    return [kw];
  }

  /**
   * Load and display a warning dialog about out of bounds extent
   * @param extent - Extent value
   * @param app - App identifier
   */
  loadWarningBootstrap(extent, app: string): void {
    this.hsDialogContainerService.create(
      HsCompositionsWarningDialogComponent,
      {
        extent: extent,
        composition_title: this.get(app).current_composition_title,
        message: this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMPOSITIONS.dialogWarning',
          'outOfBounds',
          undefined,
          app
        ),
      },
      app
    );
  }
  /**
   * @public
   * Parse composition object to extract individual layers and add them to map
   * @param j - Composition object with Layers
   * @param app - App identifier
   * @returns Array of created layers
   */
  async jsonToLayers(j, app: string): Promise<Layer<Source>[]> {
    const layers = [];
    if (j.data) {
      j = j.data;
    }
    const baselayersOnTop = j.layers[0]?.base;
    for (const lyr_def of j.layers) {
      const layer = await this.jsonToLayer(lyr_def, app);
      if (layer == undefined) {
        if (lyr_def.protocol.format != 'hs.format.externalWFS') {
          this.$log.warn(
            'Was not able to parse layer from composition',
            lyr_def
          );
          this.hsToastService.createToastPopupMessage(
            this.hsLanguageService.getTranslation(
              'COMPOSITIONS.errorWhileCreatingLayerFromComposition'
            ),
            this.hsLanguageService.getTranslation(
              'COMPOSITIONS.notAbleToParseLayerFromComposition'
            ) +
              ' ' +
              lyr_def.title,
            {
              disableLocalization: true,
              serviceCalledFrom: 'HsCompositionsParserService',
            },
            app
          );
        }
      } else {
        const addToList = baselayersOnTop ? 'push' : 'unshift';
        layers[addToList](layer);
      }
    }
    return layers;
  }

  /**
   * @public
   * Select correct layer parser for input data based on layer "className" property (HSLayers.Layer.WMS/OpenLayers.Layer.Vector)
   * @param lyr_def - Layer to be created (encapsulated in layer definition object)
   * @param app - App identifier
   * @returns Parser function to create layer (using config_parsers service)
   */
  async jsonToLayer(lyr_def, app: string): Promise<any> {
    let resultLayer;
    switch (lyr_def.className) {
      case 'HSLayers.Layer.WMS':
      case 'WMS':
        resultLayer = this.hsCompositionsLayerParserService.createWmsLayer(
          lyr_def,
          app
        );
        break;
      case 'HSLayers.Layer.WMTS':
        resultLayer = this.hsCompositionsLayerParserService.createWMTSLayer(
          lyr_def,
          app
        );
        break;
      case 'ArcGISRest':
        resultLayer =
          this.hsCompositionsLayerParserService.createArcGISLayer(lyr_def);
        break;
      case 'XYZ':
        resultLayer =
          this.hsCompositionsLayerParserService.createXYZLayer(lyr_def);
        break;
      case 'StaticImage':
        resultLayer =
          this.hsCompositionsLayerParserService.createStaticImageLayer(lyr_def);
        break;
      case 'OpenLayers.Layer.Vector':
      case 'Vector':
      case 'hs.format.LaymanWfs':
        if (lyr_def.protocol?.format == 'hs.format.externalWFS') {
          this.hsCompositionsLayerParserService.createWFSLayer(lyr_def, app);
        } else {
          resultLayer =
            await this.hsCompositionsLayerParserService.createVectorLayer(
              lyr_def,
              app
            );
        }
        break;
      default:
        const existing = this.hsMapService
          .getLayersArray(app)
          .find((l) => getTitle(l as Layer<Source>) == lyr_def.title);
        if (existing != undefined) {
          existing.setZIndex(undefined);
          return existing;
        }
        return;
    }
    if (resultLayer) {
      resultLayer = await resultLayer; //createWMTSLayer returns Promise which need to be resolved first
      setMetadata(resultLayer, lyr_def.metadata);
      setSwipeSide(resultLayer, lyr_def.swipeSide);
    }
    return resultLayer;
  }
}
