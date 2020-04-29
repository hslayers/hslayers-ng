import '../../styles/styles.module';
import VectorLayer from 'ol/layer/Vector';
import VectorLayerDescriptor from './VectorLayerDescriptor';

export default [
  'hs.map.service',
  'hs.utils.service',
  function (hsMap, utils) {
    const me = this;

    /**
     * Load nonwms OWS data and create layer
     * @memberof hs.addLayers
     * @function add
     * @param {String} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
     * @param {String} url Url of data/service localization
     * @param {String} title Title of new layer
     * @param {String} abstract Abstract of new layer
     * @param {String} srs EPSG code of selected projection (eg. "EPSG:4326")
     * @param {Object} options Other options
     * @return {Promise} Return Promise which return OpenLayers vector layer
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
          if (hsMap.map) {
            hsMap.map.addLayer(lyr);
          }
          resolve(lyr);
        } catch (ex) {
          reject(ex);
        }
      });
    };

    /**
     * Load nonwms OWS data and create layer
     * @memberof hs.addLayers
     * @function add
     * @param {String} type Type of data to load (supports Kml, Geojson, Wfs and Sparql)
     * @param {String} url Url of data/service localization
     * @param {String} title Title of new layer
     * @param {String} abstract Abstract of new layer
     * @param {String} srs EPSG code of selected projection (eg. "EPSG:4326")
     * @param {Object} options Other options
     * @return {Promise} Return Promise which return OpenLayers vector layer
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
        url = utils.proxify(url);
      }

      if (angular.isUndefined(type) || type == '') {
        type = me.tryGuessTypeFromUrl(url);
      }

      let mapProjection;
      if (hsMap.map) {
        mapProjection = hsMap.map.getView().getProjection().getCode();
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

    function tryFit(extent) {
      if (
        !isNaN(extent[0]) &&
        !isNaN(extent[1]) &&
        !isNaN(extent[2]) &&
        !isNaN(extent[3]) &&
        hsMap.map
      ) {
        hsMap.map.getView().fit(extent, hsMap.map.getSize());
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
  },
];
