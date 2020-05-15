import '../../styles/styles.module';
/**
 * @param HsMapService
 * @param HsPermalinkUrlService
 * @param HsAddLayersVectorService
 */
export default function (
  HsMapService,
  HsPermalinkUrlService,
  HsAddLayersVectorService
) {
  'ngInject';
  const me = this;

  me.checkUrlParamsAndAdd = async function () {
    const title =
      decodeURIComponent(HsPermalinkUrlService.getParamValue('title')) ||
      'Layer';
    const abstract = decodeURIComponent(
      HsPermalinkUrlService.getParamValue('abstract')
    );

    if (HsPermalinkUrlService.getParamValue('geojson_to_connect')) {
      const url = HsPermalinkUrlService.getParamValue('geojson_to_connect');
      let type = 'geojson';
      if (url.indexOf('gpx') > 0) {
        type = 'gpx';
      }
      if (url.indexOf('kml') > 0) {
        type = 'kml';
      }
      const lyr = await HsAddLayersVectorService.addVectorLayer(
        type,
        url,
        title,
        abstract,
        'EPSG:4326'
      );
      HsAddLayersVectorService.fitExtent(lyr);
    }

    if (HsPermalinkUrlService.getParamValue('kml_to_connect')) {
      const url = HsPermalinkUrlService.getParamValue('kml_to_connect');
      const lyr = await HsAddLayersVectorService.addVectorLayer(
        'kml',
        url,
        title,
        abstract,
        'EPSG:4326',
        {extractStyles: true}
      );
      HsAddLayersVectorService.fitExtent(lyr);
    }
  };

  HsMapService.loaded().then((map) => {
    me.checkUrlParamsAndAdd();
  });

  return me;
}
