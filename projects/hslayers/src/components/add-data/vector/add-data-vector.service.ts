import BaseLayer from 'ol/layer/Base';
import {GeoJSON} from 'ol/format';
import {Vector as VectorSource} from 'ol/source';
import {gpx} from '@tmcw/togeojson';
import {kml} from '@tmcw/togeojson';

import '../../styles/styles.module';
import {HsAddDataService} from '../add-data.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsVectorLayerOptions} from './vector-layer-options.type';
import {Injectable} from '@angular/core';
import {Layer, Vector as VectorLayer} from 'ol/layer';
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
  ): Promise<VectorLayer> {
    if (
      type.toLowerCase() != 'sparql' &&
      type.toLowerCase() != 'wfs' &&
      url !== undefined
    ) {
      url = this.hsUtilsService.proxify(url);
    }

    if (this.hsUtilsService.undefineEmptyString(type) === undefined) {
      type = this.tryGuessTypeFromUrl(url);
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

  fitExtent(lyr: Layer): void {
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

  tryGuessTypeFromUrl(url: string): string {
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
  async readUploadedFile(file: any): Promise<any> {
    let uploadedData: any = {};
    const fileType = this.tryGuessTypeFromName(file.name.toLowerCase());
    switch (fileType) {
      case 'kml':
      case 'gpx':
        uploadedData = await this.convertUploadedData(file);
        break;
      default:
        try {
          const fileContents = await this.readUploadedFileAsText(file);
          const fileToJSON = JSON.parse(<string>fileContents);
          if (fileToJSON !== undefined) {
            if (fileToJSON.features.length > 0) {
              fileToJSON.name = file.name.split('.')[0];
              uploadedData = this.createVectorObjectFromJson(fileToJSON);
              return uploadedData;
            }
          }
        } catch (e) {
          console.log('Uploaded file is not supported!', e);
        }
    }
    return uploadedData;
  }

  createVectorObjectFromJson(json: any): any {
    const format = new GeoJSON();
    const features = format.readFeatures(json);
    const projection = format.readProjection(json);
    const mapProjection = this.hsMapService.map.getView().getProjection();
    if (projection != mapProjection) {
      features.forEach((f) =>
        //TODO: Make it parallel using workers or some library
        f.getGeometry().transform(projection, mapProjection)
      );
    }
    const object = {
      name: json.name,
      title: json.name,
      srs: projection,
      features: features,
    };
    return object;
  }

  /**
   * Reads and returns features from uploaded file as objects
   * @param json - Uploaded file parsed as json object
   */
  getFeatureObjects(json: any): any {
    const format = new GeoJSON();
    const features = format.readFeatures(json);
    const projection = format.readProjection(json) || 'EPSG:4326';
    const mapProjection = this.hsMapService.map
      ? this.hsMapService.map.getView().getProjection()
      : 'EPSG:3857';
    features.forEach((f) => {
      if (projection != mapProjection) {
        f.getGeometry().transform(projection, mapProjection);
      }
    });
    return features;
  }

  async convertUploadedData(file: any): Promise<any> {
    const parser = new DOMParser();
    const uploadedData: any = {};
    let contentInJSON;
    try {
      const uploadedContent: any = await this.readUploadedFileAsText(file);
      const fileType = this.tryGuessTypeFromName(file.name.toLowerCase());
      switch (fileType) {
        case 'kml':
          contentInJSON = kml(
            parser.parseFromString(uploadedContent, 'text/xml')
          );
          break;
        case 'gpx':
          contentInJSON = gpx(
            parser.parseFromString(uploadedContent, 'text/xml')
          );
          break;
        default:
          contentInJSON = JSON.parse(<string>uploadedContent);
      }
      if (contentInJSON?.features?.length > 0) {
        uploadedData.features = this.getFeatureObjects(contentInJSON);
      }
      uploadedData.title = file.name.split('.')[0].trim();
      uploadedData.type = fileType;
      return uploadedData;
    } catch (e) {
      // Reason: Uploaded file is not supported' + e,
    }
  }

  /**
   * Tries to guess file type based on the file extension
   * @param name - Parsed file name from uploaded file
   */
  tryGuessTypeFromName(name: string): string {
    if (name !== undefined) {
      if (name.toLowerCase().endsWith('kml')) {
        return 'kml';
      }
      if (name.toLowerCase().endsWith('gpx')) {
        return 'gpx';
      }
      if (
        name.toLowerCase().endsWith('geojson') ||
        name.toLowerCase().endsWith('json')
      ) {
        return 'geojson';
      }
    }
  }
}
