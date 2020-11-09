import '../../styles/styles.module';
import {Injectable} from '@angular/core';
import {Layer, Vector as VectorLayer} from 'ol/layer';

import VectorLayerDescriptor from './VectorLayerDescriptor';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsUtilsService} from '../../utils/utils.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddLayersVectorService {
  constructor(
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService,
    private HsStylerService: HsStylerService
  ) {}

  /**
   * @function addVectorLayer
   * @description Load nonwms OWS data and create layer
   * @param {string} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param {string} url Url of data/service localization
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {object} options Other options
   * @returns {Promise} Return Promise which return OpenLayers vector layer
   */
  addVectorLayer(
    type: string,
    url: string,
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
          title,
          abstract,
          srs,
          options
        );
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
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {object} options Other options
   * @returns {Promise} Return Promise which return OpenLayers vector layer
   */
  createVectorLayer(
    type: string,
    url: string,
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
      title,
      abstract,
      url,
      srs,
      options,
      mapProjection
    );

    const src = new descriptor.sourceClass(descriptor);
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
