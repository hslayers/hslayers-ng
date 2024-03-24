import {Injectable} from '@angular/core';

import {Feature} from 'ol';
import {Projection, get as getProjection} from 'ol/proj';
import {PROJECTIONS as epsg4326Aliases} from 'ol/proj/epsg4326';

import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';

import {HsAddDataVectorUtilsService} from './vector-utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataVectorUploadService {
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
    private hsLog: HsLogService,
    private hsMapService: HsMapService,
    private hsAddDataVectorUtilsService: HsAddDataVectorUtilsService,
  ) {}

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
      this.hsLog.warn('Uploaded file is not supported!');
      return {error: 'couldNotUploadSelectedFile'};
    }
  }

  /**
   * Read uploaded file and extract the data as JSON object
   * @param file - File uploaded by the user
   * @returns JSON object with parsed data
   */
  async readUploadedFile(file: File): Promise<any> {
    let uploadedData;
    const fileType = this.hsAddDataVectorUtilsService.tryGuessTypeFromNameOrUrl(
      file.name.toLowerCase(),
    );
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
            uploadedData = await this.createVectorObjectFromJson(fileToJSON);
            return uploadedData;
          }
        } catch (e) {
          this.hsLog.warn('Uploaded file is not supported!', e);
          return {error: 'couldNotUploadSelectedFile'};
        }
    }
    return uploadedData;
  }

  /**
   * Convert uploaded KML or GPX files into GeoJSON format / parse loaded GeoJSON
   * @param file - Uploaded KML, GPX or GeoJSON files
   */
  async convertUploadedData(file: File): Promise<any> {
    let parser;
    const uploadedData: any = {};
    try {
      const uploadedContent: any = await this.readUploadedFileAsText(file);
      let fileType = this.hsAddDataVectorUtilsService.tryGuessTypeFromNameOrUrl(
        file.name.toLowerCase(),
      );
      switch (fileType) {
        case 'kml':
          const KML = (await import('ol/format/KML')).default;
          parser = new KML();
          uploadedData.features = parser.readFeatures(uploadedContent);
          break;
        case 'gpx':
          const GPX = (await import('ol/format/GPX')).default;
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
        );
      }
      uploadedData.nativeFeatures = parser.readFeatures(uploadedContent);
      uploadedData.nativeSRS = parser.readProjection(uploadedContent);
      uploadedData.title = file.name.split('.')[0].trim();
      uploadedData.name = uploadedData.title;
      uploadedData.type = fileType;
      return uploadedData;
    } catch (e) {
      this.hsLog.warn('Uploaded file is not supported' + e);
      return {error: 'couldNotUploadSelectedFile'};
    }
  }

  /**
   * Read features from uploaded file as objects
   * @param json - Uploaded file parsed as json object
   * @returns JSON object with file name and read features
   */
  async createVectorObjectFromJson(json: any): Promise<any> {
    let features: Feature[] = [];
    const GeoJSON = (await import('ol/format/GeoJSON')).default;
    const format = new GeoJSON();
    const projection = format.readProjection(json);
    if (!projection) {
      return {
        error: 'ERROR.srsNotSupported',
      };
    }
    if (json.features?.length > 0) {
      features = format.readFeatures(json);
      this.transformFeaturesIfNeeded(features, projection);
    }
    const object = {
      name: json.name,
      title: json.name,
      srs: this.hsAddDataVectorUtilsService.getFeaturesProjection(projection),
      features: features, //Features in map crs
      nativeFeatures: format.readFeatures(json), //Features in native CRS
      nativeSRS: projection,
    };
    return object;
  }

  /**
   * Transform features to other projection if needed
   * @param features - Extracted features from uploaded file
   * @param projection - Projection to which transform the features
   */
  transformFeaturesIfNeeded(features: Feature[], projection: Projection): void {
    const mapProjection = this.hsMapService.getMap().getView().getProjection();
    if (projection != mapProjection) {
      projection = epsg4326Aliases
        .map((proj) => proj.getCode())
        .some((code) => code === projection.getCode())
        ? getProjection('EPSG:4326')
        : projection;
      features.forEach((f) =>
        //TODO: Make it parallel using workers or some library
        f.getGeometry().transform(projection, mapProjection),
      );
    }
  }
}
