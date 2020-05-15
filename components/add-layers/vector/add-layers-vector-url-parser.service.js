import '../../styles/styles.module';
import {unByKey} from 'ol/Observable';
export default [
  'HsMapService',
  'HsPermalinkUrlService',
  'HsLayoutService',
  'HsAddLayersVectorService',
  function (OlMap, permalink, layoutService, addLayersVectorService) {
    const me = this;


    me.checkUrlParamsAndAdd = async function () {
      const title =
        decodeURIComponent(permalink.getParamValue('title')) || 'Layer';
      const abstract = decodeURIComponent(permalink.getParamValue('abstract'));

      if (permalink.getParamValue('geojson_to_connect')) {
        const url = permalink.getParamValue('geojson_to_connect');
        let type = 'geojson';
        if (url.indexOf('gpx') > 0) {
          type = 'gpx';
        }
        if (url.indexOf('kml') > 0) {
          type = 'kml';
        }
        const lyr = await addLayersVectorService.addVectorLayer(
          type,
          url,
          title,
          abstract,
          'EPSG:4326'
        );
        addLayersVectorService.fitExtent(lyr);
      }

      if (permalink.getParamValue('kml_to_connect')) {
        const url = permalink.getParamValue('kml_to_connect');
        const lyr = await addLayersVectorService.addVectorLayer(
          'kml',
          url,
          title,
          abstract,
          'EPSG:4326',
          {extractStyles: true}
        );
        addLayersVectorService.fitExtent(lyr);
      }
    };

    OlMap.loaded().then((map) => {
      me.checkUrlParamsAndAdd();
    });

    return me;
  },
];
