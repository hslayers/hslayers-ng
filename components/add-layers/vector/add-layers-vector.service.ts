import '../../styles/styles.module';
import VectorLayerDescriptor from './VectorLayerDescriptor';
import {GeoJSON} from 'ol/format';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';
import {Injectable} from '@angular/core';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {VectorSourceDescriptor} from './vector-source-descriptor';
import {gpx, kml} from '@tmcw/togeojson';
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

  changeListener = function (src) {
    if (src.getState() == 'ready') {
      setTimeout(() => {
        if (src.getFeatures().length == 0) {
          return;
        }
        const extent = src.getExtent();
        this.tryFit(extent, src);
      }, 1000);
    }
  };

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
    let fileToJSON: any;
    if (file.name.includes('.kml')) {
      fileToJSON = kml(new DOMParser().parseFromString(file, 'text/xml'));
      this.addNewLayer(fileToJSON);
    } else if (file.name.includes('.gpx')) {
      fileToJSON = gpx(new DOMParser().parseFromString(file, 'text/xml'));
      this.addNewLayer(fileToJSON);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          fileToJSON = JSON.parse(<string>reader.result);
          if (fileToJSON !== undefined) {
            this.addNewLayer(fileToJSON);
          }
        } catch (ex) {
          // do nothing
        }
      };
      reader.readAsText(file);
    }
  }
  async addNewLayer(json: any): Promise<void> {
    if (json.features.length > 0) {
      const format = new GeoJSON();
      const options = {
        features: format.readFeatures(json),
      };
      const data = {
        title: json.name,
        projection: format.readProjection(json),
      };
      const mapProjection = this.hsMapService.map.getView().getProjection();
      if (data.projection != mapProjection) {
        options.features.forEach((f) =>
          //TODO: Make it parallel using workers or some library
          f.getGeometry().transform(data.projection, mapProjection)
        );
      }
      const layer = await this.addVectorLayer(
        '',
        undefined,
        data.title || 'Layer', //name
        data.title || 'Layer',
        '',
        data.projection,
        options
      );
      this.fitExtent(layer);
    }
  }
}
