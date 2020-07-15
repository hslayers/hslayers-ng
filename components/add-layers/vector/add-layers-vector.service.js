import '../../styles/styles.module';
import VectorLayer from 'ol/layer/Vector';
import VectorLayerDescriptor from './VectorLayerDescriptor';

/**
 * @param HsMapService
 * @param HsUtilsService
 */
export class HsAddLayersVectorService {
  constructor(HsMapService, HsUtilsService) {
    'ngInject';
    this.HsMapService = HsMapService;
    this.HsUtilsService = HsUtilsService;
  }

  /**
   * Load nonwms OWS data and create layer
   *
   * @memberof hs.addLayers
   * @function add
   * @param {string} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param {string} url Url of data/service localization
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {object} options Other options
   * @returns {Promise} Return Promise which return OpenLayers vector layer
   */
  addVectorLayer(type, url, title, abstract, srs, options) {
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
   * Load nonwms OWS data and create layer
   *
   * @memberof hs.addLayers
   * @function add
   * @param {string} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
   * @param {string} url Url of data/service localization
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {object} options Other options
   * @returns {Promise} Return Promise which return OpenLayers vector layer
   */
  createVectorLayer(type, url, title, abstract, srs, options) {
    if (angular.isUndefined(options)) {
      options = {};
    }
    if (
      type.toLowerCase() != 'sparql' &&
      type.toLowerCase() != 'wfs' &&
      angular.isDefined(url)
    ) {
      url = this.HsUtilsService.proxify(url);
    }

    if (angular.isUndefined(type) || type == '') {
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
    const lyr = new VectorLayer(descriptor.layerParams);
    return lyr;
  }

  fitExtent(lyr) {
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
  tryFit(extent) {
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

  tryGuessTypeFromUrl(url) {
    if (angular.isDefined(url)) {
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
