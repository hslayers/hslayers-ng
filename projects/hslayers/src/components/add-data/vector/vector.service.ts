import {Injectable} from '@angular/core';

import {GPX, GeoJSON, KML} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';
import {PROJECTIONS as epsg4326Aliases} from 'ol/proj/epsg4326';
import {get as getProjection} from 'ol/proj';

import {HsAddDataService} from '../add-data.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsVectorLayerOptions} from './vector-layer-options.type';
import {VectorLayerDescriptor} from './vector-descriptors/vector-layer-descriptor';
import {VectorSourceDescriptor} from './vector-descriptors/vector-source-descriptor';
import {
  getHsLaymanSynchronizing,
  setDefinition,
} from '../../../common/layer-extensions';

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
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsStylerService: HsStylerService,
    public hsAddDataService: HsAddDataService,
    public hsCommonEndpointsService: HsCommonEndpointsService
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
   * @returns Return Promise which return OpenLayers vector layer
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
   * @returns Return Promise which return OpenLayers vector layer
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
      await this.hsStylerService.parseStyle(descriptor.layerParams.style, app)
    );
    const lyr = new VectorLayer(descriptor.layerParams);
    return lyr;
  }

  fitExtent(lyr: VectorLayer<VectorSource<Geometry>>, app: string): void {
    const src = lyr.getSource();
    if (src.getFeatures().length > 0) {
      this.tryFit(src.getExtent(), src, app);
    } else {
      src.on('change', this.changeListener(src, app));
    }
  }

  setPanelToCatalogue(app: string): void {
    this.hsAddDataService.apps[app].dsSelected = 'catalogue';
  }

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

  async awaitLayerSync(layer): Promise<any> {
    while (getHsLaymanSynchronizing(layer)) {
      await new Promise((r) => setTimeout(r, 200));
    }
    return true;
  }

  async addNewLayer(data: any, app: string): Promise<any> {
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
        workspace: this.hsCommonEndpointsService.endpoints.filter(
          (ep) => ep.type == 'layman'
        )[0]?.user,
        queryCapabilities:
          data.dataType != 'kml' &&
          data.dataType != 'gpx' &&
          !data.url?.endsWith('json'),
        saveToLayman: data.saveToLayman,
      },
      app,
      data.addUnder
    );
    this.fitExtent(layer, app);

    if (data.saveToLayman) {
      this.awaitLayerSync(layer).then(() => {
        layer.getSource().dispatchEvent('addfeature');
      });
    }
    return layer;
  }

  isKml(dataType: string, url: string): boolean {
    if (dataType == 'kml' || url?.endsWith('kml')) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @param extent -
   * @param src -
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
   * @param name - Parsed file name from uploaded file
   */
  tryGuessTypeFromNameOrUrl(url: string): string {
    if (url !== undefined) {
      if (url.toLowerCase().endsWith('kml')) {
        return 'kml';
      }
      if (url.toLowerCase().endsWith('gpx')) {
        return 'gpx';
      }
      if (
        url.toLowerCase().endsWith('geojson') ||
        url.toLowerCase().endsWith('json')
      ) {
        return 'geojson';
      }
    }
  }

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

  async readUploadedFile(file: any, app: string): Promise<any> {
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
   * Reads and returns features from uploaded file as objects
   * @param json - Uploaded file parsed as json object
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
      srs: projection,
      features,
    };
    return object;
  }

  transformFeaturesIfNeeded(features, projection, app: string): void {
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
   * Converts uploaded kml or gpx files into GeoJSON format / parse loaded GeoJSON
   * @param file - Uploaded  kml, gpx or GeoJSON files
   */
  async convertUploadedData(file: any, app: string): Promise<any> {
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
