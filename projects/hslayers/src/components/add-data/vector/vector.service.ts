import {Injectable} from '@angular/core';

import {GPX, GeoJSON, KML} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Projection, get as getProjection} from 'ol/proj';
import {Source, Vector as VectorSource} from 'ol/source';
import {PROJECTIONS as epsg4326Aliases} from 'ol/proj/epsg4326';

import Feature from 'ol/Feature';
import {HsAddDataCommonFileService} from '../common/common-file.service';
import {HsAddDataService} from '../add-data.service';
import {HsLaymanLayerDescriptor} from '../../save-map/interfaces/layman-layer-descriptor.interface';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsVectorLayerOptions} from './vector-layer-options.type';
import {OverwriteResponse} from '../enums/overwrite-response';
import {PostPatchLayerResponse} from './../../../common/layman/types/post-patch-layer-response.type';
import {UpsertLayerObject} from '../../save-map/types/upsert-layer-object.type';
import {VectorDataObject} from './vector-data.type';
import {VectorLayerDescriptor} from './vector-descriptors/vector-layer-descriptor';
import {VectorSourceDescriptor} from './vector-descriptors/vector-source-descriptor';
import {
  getHsLaymanSynchronizing,
  setDefinition,
} from '../../../common/layer-extensions';
import {getLaymanFriendlyLayerName} from '../../save-map/layman-utils';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataVectorService {
  readUploadedFileAsText = (inputFile: any) => {
    const temporaryFileReader = new FileReader();
    return new Promise((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort();
        reject(new DOMException('Problem parsing input file.'));
      };

      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result);
      };
      temporaryFileReader.readAsText(inputFile);
    });
  };
  readUploadedFileAsURL = (inputFile: any) => {
    const temporaryFileReader = new FileReader();
    return new Promise((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort();
        reject(new DOMException('Problem parsing input file.'));
      };

      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result);
      };
      temporaryFileReader.readAsDataURL(inputFile);
    });
  };
  constructor(
    private hsMapService: HsMapService,
    private hsUtilsService: HsUtilsService,
    private hsStylerService: HsStylerService,
    private hsAddDataService: HsAddDataService,
    private hsAddDataCommonFileService: HsAddDataCommonFileService,
    private hsLaymanService: HsLaymanService
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
    app: string,
    addUnder?: Layer<Source>
  ): Promise<VectorLayer<VectorSource<Geometry>>> {
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
          app
        );

        /* 
        TODO: Should have set definition property with protocol inside 
        so layer synchronizer would know if to sync 
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

        if (this.hsMapService.getMap(app)) {
          this.hsAddDataService.addLayer(lyr, app, addUnder);
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
   * @returns Promise which return OpenLayer's vector layer
   */
  async createVectorLayer(
    type: string,
    url: string,
    name: string,
    title: string,
    abstract: string,
    srs: string,
    options: HsVectorLayerOptions = {},
    app: string
  ): Promise<VectorLayer<VectorSource<Geometry>>> {
    if (
      type?.toLowerCase() != 'sparql' &&
      type?.toLowerCase() != 'wfs' &&
      url !== undefined
    ) {
      url = this.hsUtilsService.proxify(url, app);
    }

    if (this.hsUtilsService.undefineEmptyString(type) === undefined) {
      type = this.tryGuessTypeFromNameOrUrl(url);
    }

    let mapProjection;
    if (this.hsMapService.getMap(app)) {
      mapProjection = this.hsMapService
        .getMap(app)
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
      mapProjection
    );

    const sourceDescriptor = new VectorSourceDescriptor(
      type,
      url,
      srs,
      options,
      mapProjection
    );

    const src =
      sourceDescriptor.sourceClass == VectorSource
        ? new sourceDescriptor.sourceClass(sourceDescriptor.sourceParams)
        : new sourceDescriptor.sourceClass(sourceDescriptor);
    descriptor.layerParams.source = src;
    Object.assign(
      descriptor.layerParams,
      await this.hsStylerService.parseStyle(
        descriptor.layerParams.style ?? descriptor.layerParams.sld,
        app
      )
    );
    const lyr = new VectorLayer(descriptor.layerParams);
    return lyr;
  }

  /**
   * Fit map view to layer's extent
   * @param lyr - Provided layer
   * @param app - App identifier
   */
  fitExtent(lyr: VectorLayer<VectorSource<Geometry>>, app: string): void {
    const src = lyr.getSource();
    if (src.getFeatures().length > 0) {
      this.tryFit(src.getExtent(), src, app);
    } else {
      src.on('change', this.changeListener(src, app));
    }
  }

  /**
   * Set catalogue as active HSLayers panel
   * @param app - App identifier
   */
  setPanelToCatalogue(app: string): void {
    this.hsAddDataService.apps[app].dsSelected = 'catalogue';
  }

  /**
   * Listen to any source changes made
   * @param src - Layer source provided
   * @param app - App identifier
   */
  changeListener(src, app: string): any {
    if (src.getState() == 'ready') {
      setTimeout(() => {
        if (src.getFeatures().length == 0) {
          return;
        }
        const extent = src.getExtent();
        this.tryFit(extent, src, app);
      }, 1000);
    }
  }

  /**
   * Wait until layer synchonization is complete
   * @param layer - Layer provided
   */
  async awaitLayerSync(layer: Layer): Promise<any> {
    while (getHsLaymanSynchronizing(layer)) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return true;
  }

  /**
   * Add new layer to map and Layman (if possible)
   * @param data - Layer data object provided
   * @param app - App identifier
   * @returns Created layer and layer adding state (true, if complete, false otherwise)
   */
  async addNewLayer(
    data: VectorDataObject,
    app: string
  ): Promise<{layer: VectorLayer<VectorSource<Geometry>>; complete: boolean}> {
    const commonFileRef = this.hsAddDataCommonFileService.get(app);
    if (!commonFileRef.endpoint) {
      this.hsAddDataCommonFileService.pickEndpoint(app);
    }
    const addLayerRes: {
      layer: VectorLayer<VectorSource<Geometry>>;
      complete: boolean;
    } = {layer: null, complete: true};
    if (data.saveToLayman && data.saveAvailable) {
      const checkResult = await this.checkForLayerInLayman(data, app);
      if (!checkResult || checkResult == OverwriteResponse.cancel) {
        addLayerRes.complete = false;
        return addLayerRes;
      }
    }
    const layer = await this.addVectorLayer(
      data.features.length != 0 ? data.type : data.dataType,
      data.url || data.base64url,
      data.name,
      data.title,
      data.abstract,
      data.srs,
      {
        extractStyles: data.extract_styles,
        features: data.features,
        path: this.hsUtilsService.undefineEmptyString(data.folder_name),
        access_rights: data.access_rights,
        workspace: commonFileRef.endpoint?.user,
        queryCapabilities:
          data.dataType != 'kml' &&
          data.dataType != 'gpx' &&
          !data.url?.endsWith('json'),
        saveToLayman: data.saveToLayman,
        sld: typeof data.sld == 'string' ? data.sld : data.sld?.content,
      },
      app,
      data.addUnder
    );
    this.fitExtent(layer, app);
    addLayerRes.layer = layer;
    if (data.saveToLayman) {
      this.awaitLayerSync(layer).then(() => {
        layer.getSource().dispatchEvent('addfeature');
      });
    }
    return addLayerRes;
  }

  /**
   * Check if layer with the same name exists in Layman database and provide the user to choose
   * what action he wishes to take
   * @param data - Layer data object provided
   * @param app - App identifier
   * @returns Action the user took, inside promted dialog
   */
  async checkForLayerInLayman(
    data: VectorDataObject,
    app: string,
    repetive?: boolean
  ): Promise<OverwriteResponse> {
    let upsertReq: PostPatchLayerResponse;
    const commonFileRef = this.hsAddDataCommonFileService.get(app);
    commonFileRef.loadingToLayman = true;
    const exists = await this.hsAddDataCommonFileService.lookupLaymanLayer(
      data.name,
      app
    );
    if (!exists) {
      return OverwriteResponse.add;
    } else {
      const result =
        await this.hsAddDataCommonFileService.loadOverwriteLayerDialog(
          data,
          app,
          repetive
        );
      switch (result) {
        case OverwriteResponse.overwrite:
          const crsSupported = this.hsLaymanService.supportedCRRList.includes(
            data.srs
          );
          const layerDesc: UpsertLayerObject = {
            title: data.title,
            name: getLaymanFriendlyLayerName(data.name),
            crs: this.hsMapService.getCurrentProj(app).getCode(),
            workspace: commonFileRef.endpoint.user,
            access_rights: data.access_rights,
            sld: typeof data.sld == 'string' ? data.sld : data.sld?.content,
          };
          upsertReq = await this.hsLaymanService.makeUpsertLayerRequest(
            commonFileRef.endpoint,
            this.hsLaymanService.getFeatureGeoJSON(
              data.features,
              crsSupported,
              true
            ),
            layerDesc
          );
          if (!upsertReq) {
            return OverwriteResponse.cancel;
          } else if (upsertReq?.code) {
            switch (upsertReq.code) {
              case 17:
                return await this.checkForLayerInLayman(data, app);
              default:
                this.hsAddDataCommonFileService.handleLaymanError(
                  upsertReq,
                  app
                );
                return OverwriteResponse.cancel;
            }
          } else {
            await this.hsLaymanService.describeLayer(
              commonFileRef.endpoint,
              upsertReq.name,
              commonFileRef.endpoint.user
            );
            return OverwriteResponse.overwrite;
          }
        case OverwriteResponse.add:
          return await this.checkForLayerInLayman(data, app, true);
        case OverwriteResponse.cancel:
          commonFileRef.loadingToLayman = false;
          return OverwriteResponse.cancel;
        default:
      }
    }
  }

  /**
   * Check if uploaded data are KML
   * @param dataType - Uploaded data type
   * @param url -  Upload source url
   * @returns True, if data are in KML format, false otherwise
   */
  isKml(dataType: string, url: string): boolean {
    if (dataType == 'kml' || url?.endsWith('kml')) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Try to fit layer extent as map view
   * @param extent - Extent provided
   * @param src - Layer source provided
   * @param app - App identifier
   */
  tryFit(extent, src, app: string): void {
    if (
      !isNaN(extent[0]) &&
      !isNaN(extent[1]) &&
      !isNaN(extent[2]) &&
      !isNaN(extent[3]) &&
      this.hsMapService.getMap(app)
    ) {
      this.hsMapService.fitExtent(extent, app);
      src.un('change', this.changeListener);
    }
  }

  /**
   * Tries to guess file type based on the file extension
   * @param extension - Parsed file extension from uploaded file
   */
  tryGuessTypeFromNameOrUrl(extension: string): string {
    if (extension !== undefined) {
      if (extension.toLowerCase().endsWith('kml')) {
        return 'kml';
      }
      if (extension.toLowerCase().endsWith('gpx')) {
        return 'gpx';
      }
      if (
        extension.toLowerCase().endsWith('geojson') ||
        extension.toLowerCase().endsWith('json')
      ) {
        return 'geojson';
      }
    }
  }

  /**
   * Create a object containing data from XML dataset
   * @param file - File uploaded by the user
   * @param type - Data type
   */
  async createVectorObjectFromXml(file: File, type: string): Promise<any> {
    try {
      const uploadedContent = await this.readUploadedFileAsURL(file);
      const dataUrl = uploadedContent.toString();
      const object = {
        url: dataUrl,
        name: file.name,
        title: file.name,
        type: type,
      };
      return object;
    } catch (e) {
      console.log('Uploaded file is not supported!');
    }
  }

  /**
   * Read uploaded file and extract the data as JSON object
   * @param file - File uploaded by the user
   * @param app - App identifier
   * @returns JSON object with parsed data
   */
  async readUploadedFile(file: File, app: string): Promise<any> {
    let uploadedData: any = {};
    const fileType = this.tryGuessTypeFromNameOrUrl(file.name.toLowerCase());
    switch (fileType) {
      case 'kml':
        uploadedData = await this.createVectorObjectFromXml(file, fileType);
        break;
      case 'gpx':
        uploadedData = await this.convertUploadedData(file, app);
        break;
      default:
        try {
          const fileContents = await this.readUploadedFileAsText(file);
          const fileToJSON = JSON.parse(<string>fileContents);
          if (fileToJSON !== undefined) {
            fileToJSON.name = file.name.split('.')[0];
            uploadedData = this.createVectorObjectFromJson(fileToJSON, app);
            return uploadedData;
          }
        } catch (e) {
          console.log('Uploaded file is not supported!', e);
        }
    }
    return uploadedData;
  }

  /**
   * Read features from uploaded file as objects
   * @param json - Uploaded file parsed as json object
   * @param app - App identifier
   * @returns JSON object with file name and read features
   */
  createVectorObjectFromJson(json: any, app: string): any {
    let features = [];
    const format = new GeoJSON();
    const projection = format.readProjection(json);
    if (json.features?.length > 0) {
      features = format.readFeatures(json);
      this.transformFeaturesIfNeeded(features, projection, app);
    }
    const object = {
      name: json.name,
      title: json.name,
      srs: epsg4326Aliases
        .map((proj) => proj.getCode())
        .some((code) => code === projection.getCode())
        ? getProjection('EPSG:4326')
        : this.hsLaymanService.supportedCRRList.indexOf(projection.getCode()) >
          -1
        ? projection
        : getProjection('EPSG:4326'),
      features,
    };
    return object;
  }

  /**
   * Transform features to other projection if needed
   * @param features - Extracted features from uploaded file
   * @param projection - Projection to which transform the features
   * @param app - App identifier
   */
  transformFeaturesIfNeeded(
    features: Feature[],
    projection: Projection,
    app: string
  ): void {
    const mapProjection = this.hsMapService
      .getMap(app)
      .getView()
      .getProjection();
    if (projection != mapProjection) {
      projection = epsg4326Aliases
        .map((proj) => proj.getCode())
        .some((code) => code === projection.getCode())
        ? getProjection('EPSG:4326')
        : projection;
      features.forEach((f) =>
        //TODO: Make it parallel using workers or some library
        f.getGeometry().transform(projection, mapProjection)
      );
    }
  }

  /**
   * Convert uploaded kml or gpx files into GeoJSON format / parse loaded GeoJSON
   * @param file - Uploaded  kml, gpx or GeoJSON files
   * @param app - App identifier
   */
  async convertUploadedData(file: File, app: string): Promise<any> {
    let parser;
    const uploadedData: any = {};
    try {
      const uploadedContent: any = await this.readUploadedFileAsText(file);
      let fileType = this.tryGuessTypeFromNameOrUrl(file.name.toLowerCase());
      switch (fileType) {
        case 'kml':
          parser = new KML();
          uploadedData.features = parser.readFeatures(uploadedContent);
          break;
        case 'gpx':
          parser = new GPX();
          uploadedData.features = parser.readFeatures(uploadedContent);
          fileType = 'json';
          break;
        default:
      }
      if (uploadedData?.features?.length > 0) {
        this.transformFeaturesIfNeeded(
          uploadedData.features,
          parser.readProjection(uploadedContent),
          app
        );
      }
      uploadedData.title = file.name.split('.')[0].trim();
      uploadedData.name = uploadedData.title;
      uploadedData.type = fileType;
      return uploadedData;
    } catch (e) {
      console.error('Uploaded file is not supported' + e);
    }
  }
}
