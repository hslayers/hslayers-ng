import '../../styles/styles.module';
import BaseLayer from 'ol/layer/Base';
import VectorLayerDescriptor from './VectorLayerDescriptor';
import {HsAddLayersService} from '../add-layers.service';
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
    public HsStylerService: HsStylerService,
    private hsAddLayersService: HsAddLayersService
  ) {}

  /**
   * @function addVectorLayer
   * @description Load nonwms OWS data and create layer
   * @param {string} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param {string} url Url of data/service localization
   * @param name
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param addBefore
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
    options: any,
    addBefore?: BaseLayer
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
        lyr.set('definition', {
          format: 'hs.format.WFS',
          url: url.replace('ows', 'wfs'),
        });
        if (this.HsMapService.map) {
          this.hsAddLayersService.addLayer(lyr, addBefore);
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
      this.tryFit(src.getExtent());
    } else {
      src.on('change', (e) => {
        if (src.getState() == 'ready') {
          if (src.getFeatures().length == 0) {
            return;
          }
          const extent = src.getExtent();
          this.tryFit(extent);
        }
      });
    }
  }

  /**
   * @param extent
   * @private
   */
  tryFit(extent): void {
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
}
