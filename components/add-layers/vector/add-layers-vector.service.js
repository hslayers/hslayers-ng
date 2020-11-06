import '../../styles/styles.module';
import VectorLayer from 'ol/layer/Vector';
import VectorLayerDescriptor from './VectorLayerDescriptor';

/**
 * @param HsMapService
 * @param HsUtilsService
 */
export default function (HsMapService, HsUtilsService) {
  'ngInject';
  const me = this;

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
  me.addVectorLayer = function (type, url, title, abstract, srs, options) {
    return new Promise((resolve, reject) => {
      try {
        const lyr = me.createVectorLayer(
          type,
          url,
          title,
          abstract,
          srs,
          options
        );
        lyr.set('definition', {
          format: 'hs.format.WFS',
          url: url.replace('ows', 'wfs'),
        });
        if (HsMapService.map) {
          HsMapService.addLayer(lyr, true);
        }
        resolve(lyr);
      } catch (ex) {
        reject(ex);
      }
    });
  };

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
  me.createVectorLayer = function (type, url, title, abstract, srs, options) {
    if (angular.isUndefined(options)) {
      options = {};
    }
    if (
      type.toLowerCase() != 'sparql' &&
      type.toLowerCase() != 'wfs' &&
      angular.isDefined(url)
    ) {
      url = HsUtilsService.proxify(url);
    }

    if (angular.isUndefined(type) || type == '') {
      type = me.tryGuessTypeFromUrl(url);
    }

    let mapProjection;
    if (HsMapService.map) {
      mapProjection = HsMapService.map.getView().getProjection().getCode();
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
  };

  me.fitExtent = function (lyr) {
    const src = lyr.getSource();
    if (src.getFeatures().length > 0) {
      tryFit(src.getExtent());
    } else {
      src.on('change', (e) => {
        if (src.getState() == 'ready') {
          if (src.getFeatures().length == 0) {
            return;
          }
          const extent = src.getExtent();
          tryFit(extent);
        }
      });
    }
  };

  /**
   * @param extent
   */
  function tryFit(extent) {
    if (
      !isNaN(extent[0]) &&
      !isNaN(extent[1]) &&
      !isNaN(extent[2]) &&
      !isNaN(extent[3]) &&
      HsMapService.map
    ) {
      HsMapService.map.getView().fit(extent, HsMapService.map.getSize());
    }
  }

  me.tryGuessTypeFromUrl = function (url) {
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
  };

  return me;
}
