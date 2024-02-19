import {Injectable} from '@angular/core';

import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';
import {get as getProjection} from 'ol/proj';

import {HsAddDataCommonFileService} from '../common-file.service';
import {HsAddDataService} from '../add-data.service';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsStylerService} from 'hslayers-ng/shared/styler';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {OverwriteResponse} from 'hslayers-ng/types';
import {PostPatchLayerResponse} from 'hslayers-ng/common/layman';
import {SparqlJson} from 'hslayers-ng/common/layers';
import {UpsertLayerObject} from 'hslayers-ng/types';
import {VectorDataObject} from 'hslayers-ng/types';

import {
  awaitLayerSync,
  getLaymanFriendlyLayerName,
} from 'hslayers-ng/common/layman';
import {setDefinition} from 'hslayers-ng/common/extensions';

import {HsAddDataVectorUtilsService} from './vector-utils.service';
import {HsVectorLayerOptions} from 'hslayers-ng/types';
import {VectorLayerDescriptor} from 'hslayers-ng/types';
import {VectorSourceDescriptor} from 'hslayers-ng/types';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataVectorService {
  constructor(
    private hsAddDataCommonFileService: HsAddDataCommonFileService,
    private hsAddDataService: HsAddDataService,
    private hsLaymanService: HsLaymanService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsLog: HsLogService,
    private hsMapService: HsMapService,
    private hsStylerService: HsStylerService,
    private hsUtilsService: HsUtilsService,
    private hsAddDataVectorUtilsService: HsAddDataVectorUtilsService,
  ) {}

  /**
   * Load non-wms OWS data and create layer
   * @param type - Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param url - Url of data/service localization
   * @param name -
   * @param title - Title of new layer
   * @param abstract - Abstract of new layer
   * @param addUnder -
   * @param srs - EPSG code of selected projection (eg. "EPSG:4326")
   * @param options - Other options
   * @returns Promise which return OpenLayers vector layer
   */
  addVectorLayer(
    type: string,
    url: string,
    name: string,
    title: string,
    abstract: string,
    srs: string,
    options: HsVectorLayerOptions,
    addUnder?: Layer<Source>,
  ): Promise<VectorLayer<VectorSource>> {
    return new Promise(async (resolve, reject) => {
      try {
        const lyr = await this.createVectorLayer(
          type,
          url,
          name,
          title,
          abstract,
          srs,
          options,
        );
        /* 
        Set definition property with protocol inside 
        so layer synchronizer knows whether to sync
        */
        if (options.saveToLayman) {
          if (this.hsUtilsService.undefineEmptyString(url) !== undefined) {
            setDefinition(lyr, {
              format: 'hs.format.WFS',
              url: url,
            });
          } else {
            setDefinition(lyr, {
              format: 'hs.format.WFS',
            });
          }
        }
        if (this.hsMapService.getMap()) {
          this.hsAddDataService.addLayer(lyr, addUnder);
        }
        resolve(lyr);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  /**
   * Load non-wms OWS data and create layer
   * @param type - Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param url - Url of data/service localization
   * @param name -
   * @param title - Title of new layer
   * @param abstract - Abstract of new layer
   * @param srs - EPSG code of selected projection (eg. "EPSG:4326")
   * @param options - Other options
   * @returns Promise which returns OpenLayer's vector layer
   */
  async createVectorLayer(
    type: string,
    url: string,
    name: string,
    title: string,
    abstract: string,
    srs: string,
    options: HsVectorLayerOptions = {},
  ): Promise<VectorLayer<VectorSource>> {
    if (
      type?.toLowerCase() != 'sparql' &&
      type?.toLowerCase() != 'wfs' &&
      url !== undefined
    ) {
      url = this.hsUtilsService.proxify(url);
    }

    if (this.hsUtilsService.undefineEmptyString(type) === undefined) {
      type = this.hsAddDataVectorUtilsService.tryGuessTypeFromNameOrUrl(url);
    }

    let mapProjection;
    if (this.hsMapService.getMap()) {
      mapProjection = this.hsMapService
        .getMap()
        .getView()
        .getProjection()
        .getCode();
    }

    const descriptor = new VectorLayerDescriptor(
      type,
      name,
      title,
      abstract,
      url,
      options,
      mapProjection,
    );

    const sourceDescriptor = new VectorSourceDescriptor(
      type,
      url,
      srs,
      options,
      mapProjection,
    );

    const src =
      sourceDescriptor.sourceClass == VectorSource ||
      sourceDescriptor.sourceClass == SparqlJson
        ? new sourceDescriptor.sourceClass(sourceDescriptor.sourceParams)
        : new sourceDescriptor.sourceClass(sourceDescriptor);
    descriptor.layerParams.source = src;
    Object.assign(
      descriptor.layerParams,
      await this.hsStylerService.parseStyle(
        (options.sld || options.qml) ?? options.style,
      ),
    );
    return new VectorLayer(descriptor.layerParams);
  }

  /**
   * Fit map view to layer's extent
   * @param lyr - Provided layer
   */
  fitExtent(lyr: VectorLayer<VectorSource>): void {
    const src = lyr.getSource();
    if (src.getFeatures().length > 0) {
      this.tryFit(src.getExtent(), src);
    } else {
      src.on('change', this.changeListener(src));
    }
  }

  /**
   * Set catalogue as active HSLayers panel
   */
  setPanelToCatalogue(): void {
    this.hsAddDataService.selectType('catalogue');
  }

  /**
   * Listen to any source changes made
   * @param src - Layer source provided
   */
  changeListener(src): any {
    if (src.getState() == 'ready') {
      setTimeout(() => {
        if (src.getFeatures().length == 0) {
          return;
        }
        const extent = src.getExtent();
        this.tryFit(extent, src);
      }, 1000);
    }
  }

  /**
   * Construct options parameter for new vector layer being added
   */
  private buildNewLayerOptions(data: VectorDataObject): HsVectorLayerOptions {
    const serializedStyle =
      typeof data.serializedStyle === 'string'
        ? data.serializedStyle
        : data.serializedStyle?.content;
    const styleFormat = this.hsStylerService.guessStyleFormat(serializedStyle);
    return {
      extractStyles: data.extract_styles,
      features: data.saveToLayman ? null : data.features, //Features are being posted to Layman in original CRS and will be fetched later
      geomAttribute: `?${data.geomProperty}`,
      idAttribute: `?${data.idProperty}`,
      path: this.hsUtilsService.undefineEmptyString(data.folder_name),
      access_rights: data.access_rights,
      workspace: this.hsAddDataCommonFileService.endpoint?.user,
      query: data.query,
      queryCapabilities:
        data.type != 'kml' &&
        data.type != 'gpx' &&
        data.type != 'sparql' &&
        !data.url?.endsWith('json'),
      saveToLayman: data.saveToLayman,
      sld: styleFormat == 'sld' ? serializedStyle : undefined,
      qml: styleFormat == 'qml' ? serializedStyle : undefined,
    };
  }

  /**
   * Add new layer to map and Layman (if possible)
   * @param data - Layer data object provided
   * @returns Created layer and layer adding state (true, if complete, false otherwise)
   */
  async addNewLayer(
    data: VectorDataObject,
  ): Promise<{layer: VectorLayer<VectorSource>; complete: boolean}> {
    if (!this.hsAddDataCommonFileService.endpoint) {
      this.hsAddDataCommonFileService.pickEndpoint();
    }
    const addLayerRes: {
      layer: VectorLayer<VectorSource>;
      complete: boolean;
    } = {layer: null, complete: true};
    if (data.saveToLayman && data.saveAvailable) {
      const checkResult = await this.checkForLayerInLayman(data);
      if (!checkResult || checkResult == OverwriteResponse.cancel) {
        addLayerRes.complete = false;
        return addLayerRes;
      }
      const upsertResponse =
        checkResult == OverwriteResponse.overwrite
          ? {name: data.name}
          : //Create layer on layman: OverwriteResponse.add
            await this.upsertLayer(data);
      if (data.serializedStyle) {
        await this.setLaymanLayerStyle(upsertResponse.name, data);
      }
    }
    const layer = await this.addVectorLayer(
      data.features?.length > 0 ? '' : data.type,
      data.url || data.base64url,
      data.name,
      data.title,
      data.abstract,
      data.srs,
      this.buildNewLayerOptions(data),
      data.addUnder,
    );
    this.fitExtent(layer);
    addLayerRes.layer = layer;
    if (data.saveToLayman) {
      awaitLayerSync(layer).then(() => {
        layer.getSource().dispatchEvent('addfeature');
        this.fitExtent(layer);
      });
    }
    return addLayerRes;
  }

  /**
   * Get layer style from Layman endpoint before creating layer to ensure all params and values used
   * are in sync with what's on Layman e.g. to prevent inconsistencies caused by attribute names laundering
   */
  async setLaymanLayerStyle(
    layerName: string,
    data: VectorDataObject,
  ): Promise<void> {
    const descriptor = await this.hsAddDataCommonFileService.describeNewLayer(
      this.hsAddDataCommonFileService.endpoint,
      layerName,
      ['style'],
    );
    data.serializedStyle = await this.hsCommonLaymanService.getStyleFromUrl(
      descriptor.style.url,
    );
  }

  /**
   * Prepare layer for upsertion to Layman
   * @param data - Vector data object
   */
  async upsertLayer(data: VectorDataObject): Promise<PostPatchLayerResponse> {
    const commonFileRef = this.hsAddDataCommonFileService;

    const crsSupported = this.hsLaymanService.supportedCRRList.includes(
      data.nativeSRS,
    );
    const style =
      typeof data.serializedStyle == 'string'
        ? data.serializedStyle
        : data.serializedStyle?.content;
    const layerDesc: UpsertLayerObject = {
      title: data.title,
      name: getLaymanFriendlyLayerName(data.name),
      crs: this.hsAddDataVectorUtilsService
        .getFeaturesProjection(getProjection(data.nativeSRS))
        .getCode(),
      workspace: commonFileRef.endpoint.user,
      access_rights: data.access_rights,
      style,
    };
    return this.hsLaymanService.makeUpsertLayerRequest(
      commonFileRef.endpoint,
      this.hsLaymanService.getFeatureGeoJSON(
        data.nativeFeatures,
        crsSupported,
        true,
      ),
      layerDesc,
    );
  }

  /**
   * Check if layer with the same name exists in Layman database and provide the user to choose
   * what action he wishes to take
   * @param data - Layer data object provided
   * @returns Action the user took, inside prompted dialog
   */
  async checkForLayerInLayman(
    data: VectorDataObject,
    repetive?: boolean,
  ): Promise<OverwriteResponse> {
    let upsertReq: PostPatchLayerResponse;
    const commonFileRef = this.hsAddDataCommonFileService;
    commonFileRef.loadingToLayman = true;
    const exists = await this.hsAddDataCommonFileService.lookupLaymanLayer(
      data.name,
    );
    if (!exists) {
      return OverwriteResponse.add;
    } else {
      const result =
        await this.hsAddDataCommonFileService.loadOverwriteLayerDialog(
          data,
          repetive,
        );
      switch (result) {
        case OverwriteResponse.overwrite:
          upsertReq = await this.upsertLayer(data);
          if (!upsertReq) {
            return OverwriteResponse.cancel;
          } else if (upsertReq?.code) {
            switch (upsertReq.code) {
              case 17:
                return await this.checkForLayerInLayman(data);
              default:
                this.hsAddDataCommonFileService.handleLaymanError(upsertReq);
                return OverwriteResponse.cancel;
            }
          } else {
            await this.hsLaymanService.describeLayer(
              commonFileRef.endpoint,
              upsertReq.name,
              commonFileRef.endpoint.user,
            );
            return OverwriteResponse.overwrite;
          }
        case OverwriteResponse.add:
          return await this.checkForLayerInLayman(data, true);
        case OverwriteResponse.cancel:
          commonFileRef.loadingToLayman = false;
          return OverwriteResponse.cancel;
        default:
      }
    }
  }

  /**
   * Check if uploaded data are KML
   * @param fileType - Uploaded data type
   * @param url - Upload source url
   * @returns True, if data are in KML format, false otherwise
   */
  isKml(fileType: string, url: string): boolean {
    if (fileType == 'kml' || url?.endsWith('kml')) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Try to fit layer extent as map view
   * @param extent - Extent provided
   * @param src - Layer source provided
   */
  tryFit(extent, src: Source): void {
    if (
      !isNaN(extent[0]) &&
      !isNaN(extent[1]) &&
      !isNaN(extent[2]) &&
      !isNaN(extent[3]) &&
      this.hsMapService.getMap()
    ) {
      this.hsMapService.fitExtent(extent);
      src.un('change', this.changeListener);
    }
  }
}
