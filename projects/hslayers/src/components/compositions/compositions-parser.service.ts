import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import * as xml2Json from 'xml-js';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {lastValueFrom} from 'rxjs';
import {transformExtent} from 'ol/proj';

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
import {HsUtilsService} from '../utils/utils.service';

import {
  getFromComposition,
  getTitle,
  setMetadata,
  setSwipeSide,
} from '../../common/layer-extensions';
import {parseExtent, transformExtentValue} from '../../common/extent-utils';

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
    url: string,
    app: string,
    overwrite?: boolean,
    callback?,
    pre_parse?
  ): Promise<void> {
    this.get(app).current_composition_url = url;
    url = url.replace(/&amp;/g, '&');
    url = this.hsUtilsService.proxify(url, app);
    const options = {};
    if (url.includes('.wmc')) {
      pre_parse = (res) => this.parseWMC(res);
      options['responseType'] = 'text';
    }
    options['withCredentials'] = url.includes(
      this.hsCommonEndpointsService?.endpoints.filter(
        (ep) => ep.type == 'layman'
      )[0]?.url
    );
    const data: any = await lastValueFrom(this.$http.get(url, options));
    if (data?.file) {
      // Layman composition wrapper
      return this.loadUrl(data.file.url, app, overwrite, callback, pre_parse);
    }
    this.loaded(data, pre_parse, url, overwrite, callback, app);
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
        response = pre_parse(response);
      }
      response.workspace = appRef.current_composition_workspace;
      /*
      Response might contain {data:{abstract:...}} or {abstract:}
      directly. If there is data object,
      that means composition is enclosed in
      container which itself might contain title or extent
      properties */
      await this.loadCompositionObject(
        response.data || response,
        overwrite,
        app,
        response.title,
        response.extent
      );
      this.finalizeCompositionLoading(response, app);
      if (this.hsUtilsService.isFunction(callback)) {
        callback();
      }
    } else {
      this.raiseCompositionLoadError(response, app);
    }
  }

  /**
   * Parse WMC to JSON object
   * @param response - Response from http get request requesting composition data
   */
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
    app: string,
    titleFromContainer?: boolean,
    extentFromContainer?: string | Array<number>
  ): Promise<void> {
    if (overwrite == undefined || overwrite == true) {
      this.removeCompositionLayers(app);
    }
    this.hsEventBusService.currentComposition.next(obj); //Doesnt seems to be used
    this.get(app).current_composition_title = titleFromContainer || obj.title;
    const possibleExtent = extentFromContainer || obj.extent;
    if (possibleExtent !== undefined) {
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

    const layers = await this.jsonToLayers(obj, app);
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
            lyr.setVisible(true);
          }
        });
    }
  }

  /**
   * Finalize composition loading to the OL map
   * @param responseData - Response from http get request requesting composition data
   * @param app - App identifier
   */
  finalizeCompositionLoading(responseData, app: string): void {
    if (this.hsConfig.get(app).open_lm_after_comp_loaded) {
      this.hsLayoutService.setMainPanel('layermanager', app);
    }

    this.get(app).composition_edited = false;
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
   * Remove all layers gained from composition from map
   * @param app - App identifier
   */
  removeCompositionLayers(app: string): void {
    const to_be_removed = [];
    this.hsMapService.getLayersArray(app).forEach((lyr) => {
      if (getFromComposition(lyr)) {
        to_be_removed.push(lyr);
      }
    });
    while (to_be_removed.length > 0) {
      this.hsMapService.getMap(app).removeLayer(to_be_removed.shift());
    }
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
            ) + lyr_def.title,
            app,
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
      setMetadata(resultLayer, lyr_def.metadata);
      setSwipeSide(resultLayer, lyr_def.swipeSide);
    }
    return resultLayer;
  }
}
