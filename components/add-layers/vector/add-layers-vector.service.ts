import '../../styles/styles.module';
import VectorLayerDescriptor from './VectorLayerDescriptor';
import {GPX, GeoJSON, KML} from 'ol/format';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {VectorSourceDescriptor} from './vector-source-descriptor';
@Injectable({
  providedIn: 'root',
})
export class HsAddLayersVectorService {
  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsStylerService: HsStylerService
  ) {}

  /**
   * @function addVectorLayer
   * @description Load nonwms OWS data and create layer
   * @param {string} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param {string} url Url of data/service localization
   * @param name
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
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
    options: any
  ): Promise<VectorLayer> {
    return new Promise((resolve, reject) => {
      try {
        const lyr = this.createVectorLayer(
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
          lyr.set('definition', {
            format: 'hs.format.WFS',
            url: url.replace('ows', 'wfs'),
          });
        } else {
          lyr.set('definition', {
            format: 'hs.format.WFS',
          });
        }
        if (this.HsMapService.map) {
          this.HsMapService.addLayer(lyr, true);
        }
        resolve(lyr);
      } catch (ex) {
        reject(ex);
      }
    });
  }

  /**
   * @function add
   * @description Load nonwms OWS data and create layer
   * @param {string} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param {string} url Url of data/service localization
   * @param name
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {object} options Other options
   * @returns {Promise} Return Promise which return OpenLayers vector layer
   */
  createVectorLayer(
    type: string,
    url: string,
    name: string,
    title: string,
    abstract: string,
    srs: string,
    options: any = {}
  ): VectorLayer {
    if (
      type.toLowerCase() != 'sparql' &&
      type.toLowerCase() != 'wfs' &&
      url !== undefined
    ) {
      url = this.HsUtilsService.proxify(url);
    }

    if (type === undefined || type == '') {
      type = this.tryGuessTypeFromUrl(url);
    }

    let mapProjection;
    if (this.HsMapService.map) {
      mapProjection = this.HsMapService.map.getView().getProjection().getCode();
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

    const src = new sourceDescriptor.sourceClass(sourceDescriptor);
    descriptor.layerParams.source = src;
    if (descriptor.layerParams.style) {
      descriptor.layerParams.style = this.HsStylerService.parseStyle(
        descriptor.layerParams.style
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
      this.HsMapService.map
    ) {
      this.HsMapService.map
        .getView()
        .fit(extent, this.HsMapService.map.getSize());
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
  readUploadedFile(file: any): void {
    if (file.name.endsWith('kml')) {
      this.createVectorObjectFromXml(file, 'kml');
    } else if (file.name.endsWith('gpx')) {
      this.createVectorObjectFromXml(file, 'gpx');
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const fileToJSON = JSON.parse(<string>reader.result);
          if (fileToJSON !== undefined) {
            if (fileToJSON.features.length > 0) {
              this.createVectorObjectFromJson(fileToJSON);
            }
          }
        } catch (e) {
          console.log('Uploaded file is not supported!');
        }
      };
      reader.readAsText(file);
    }
  }
  async createVectorObjectFromXml(file: File, type: string): Promise<void> {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const dataUrl = <string>reader.result;
        const object = {
          url: dataUrl,
          name: file.name,
          title: file.name,
          type: type,
        };
        this.addNewLayer(object);
      } catch (e) {
        console.log('Uploaded file is not supported!');
      }
    };
    reader.readAsDataURL(file);
  }
  createVectorObjectFromJson(json: any): void {
    const format = new GeoJSON();
    const options = {
      features: format.readFeatures(json),
    };
    const projection = format.readProjection(json);
    const mapProjection = this.HsMapService.map.getView().getProjection();
    if (projection != mapProjection) {
      options.features.forEach((f) =>
        //TODO: Make it parallel using workers or some library
        f.getGeometry().transform(projection, mapProjection)
      );
    }
    const object = {
      name: json.name,
      title: json.name,
      srs: projection,
      options: options,
    };
    this.addNewLayer(object);
  }
  async addNewLayer(dataObject: any): Promise<void> {
    const layer = await this.addVectorLayer(
      dataObject.type || '',
      dataObject.url || undefined,
      dataObject.name || 'Layer', //name
      dataObject.title || 'Layer',
      dataObject.abstract || '',
      dataObject.srs || undefined,
      dataObject.options || undefined
    );
    this.fitExtent(layer);
  }
}
