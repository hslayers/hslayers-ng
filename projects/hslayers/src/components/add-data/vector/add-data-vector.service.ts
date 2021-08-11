import BaseLayer from 'ol/layer/Base';
import {GPX, GeoJSON, KML} from 'ol/format';
import {Source, Vector as VectorSource} from 'ol/source';

import '../../styles/styles.module';
import {Geometry} from 'ol/geom';
import {HsAddDataService} from '../add-data.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsVectorLayerOptions} from './vector-layer-options.type';
import {Injectable} from '@angular/core';
import {Vector as VectorLayer} from 'ol/layer';
import {VectorLayerDescriptor} from './VectorLayerDescriptor';
import {VectorSourceDescriptor} from './vector-source-descriptor';
import {setDefinition} from '../../../common/layer-extensions';

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
    private hsAddDataService: HsAddDataService
  ) {}

  /**
   * @description Load non-wms OWS data and create layer
   * @param {string} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param {string} url Url of data/service localization
   * @param name
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param addUnder
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {object} options Other options
   * @returns {Promise} Return Promise which return OpenLayers vector layer
   */
  addVectorLayer(
    type: string,
    url: string,
    name: string,
    title: string,
    abstract: string,
    srs: string,
    options: HsVectorLayerOptions,
    addUnder?: BaseLayer
  ): Promise<VectorLayer> {
    return new Promise(async (resolve, reject) => {
      try {
        const lyr = await this.createVectorLayer(
          type,
          url,
          name,
          title,
          abstract,
          srs,
          options
        );
        /* 
        TODO: Should have set definition property with protocol inside 
        so layer synchronizer would know if to sync 
        */
        if (url !== undefined) {
          setDefinition(lyr, {
            format: 'hs.format.WFS',
            url: url,
          });
        } else {
          setDefinition(lyr, {
            format: 'hs.format.WFS',
          });
        }
        if (this.hsMapService.map) {
          this.hsAddDataService.addLayer(lyr, addUnder);
        }
        resolve(lyr);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  /**
   * @description Load non-wms OWS data and create layer
   * @param {string} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param {string} url Url of data/service localization
   * @param name
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {HsVectorLayerOptions} options Other options
   * @returns {Promise} Return Promise which return OpenLayers vector layer
   */
  async createVectorLayer(
    type: string,
    url: string,
    name: string,
    title: string,
    abstract: string,
    srs: string,
    options: HsVectorLayerOptions = {}
  ): Promise<VectorLayer<VectorSource<Geometry>>> {
    if (
      type.toLowerCase() != 'sparql' &&
      type.toLowerCase() != 'wfs' &&
      url !== undefined
    ) {
      url = this.hsUtilsService.proxify(url);
    }

    if (this.hsUtilsService.undefineEmptyString(type) === undefined) {
      type = this.tryGuessTypeFromNameOrUrl(url);
    }

    let mapProjection;
    if (this.hsMapService.map) {
      mapProjection = this.hsMapService.map.getView().getProjection().getCode();
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
    if (descriptor.layerParams.style) {
      Object.assign(
        descriptor.layerParams,
        await this.hsStylerService.parseStyle(descriptor.layerParams.style)
      );
    }
    const lyr = new VectorLayer(descriptor.layerParams);
    return lyr;
  }

  fitExtent(lyr: VectorLayer<VectorSource<Geometry>>): void {
    const src = lyr.getSource();
    if (src.getFeatures().length > 0) {
      this.tryFit(src.getExtent(), src);
    } else {
      src.on('change', this.changeListener(src));
    }
  }

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
   * @param extent
   * @param src
   * @private
   */
  tryFit(extent, src): void {
    if (
      !isNaN(extent[0]) &&
      !isNaN(extent[1]) &&
      !isNaN(extent[2]) &&
      !isNaN(extent[3]) &&
      this.hsMapService.map
    ) {
      this.hsMapService.map
        .getView()
        .fit(extent, this.hsMapService.map.getSize());
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

  async readUploadedFile(file: any): Promise<any> {
    let uploadedData: any = {};
    const fileType = this.tryGuessTypeFromNameOrUrl(file.name.toLowerCase());
    switch (fileType) {
      case 'kml':
        uploadedData = await this.createVectorObjectFromXml(file, fileType);
        break;
      case 'gpx':
        uploadedData = await this.convertUploadedData(file);
        break;
      default:
        try {
          const fileContents = await this.readUploadedFileAsText(file);
          const fileToJSON = JSON.parse(<string>fileContents);
          if (fileToJSON !== undefined) {
            fileToJSON.name = file.name.split('.')[0];
            uploadedData = this.createVectorObjectFromJson(fileToJSON);
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
  createVectorObjectFromJson(json: any): any {
    let features = [];
    const format = new GeoJSON();
    const projection = format.readProjection(json);
    if (json.features?.length > 0) {
      features = format.readFeatures(json);
      this.transformFeaturesIfNeeded(features, projection);
    }
    const object = {
      name: json.name,
      title: json.name,
      srs: projection,
      features,
    };
    return object;
  }

  transformFeaturesIfNeeded(features, projection): void {
    const mapProjection = this.hsMapService.map.getView().getProjection();
    if (projection != mapProjection) {
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
  async convertUploadedData(file: any): Promise<any> {
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
          parser.readProjection(uploadedContent)
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
