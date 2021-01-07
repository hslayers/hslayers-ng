import '../../styles/styles.module';
import {HsDataVectorService} from './data-vector.service';
import {HsMapService} from '../../map/map.service';
import {HsShareUrlService} from '../../permalink/share-url.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsVectorUrlParserService {
  constructor(
    public HsMapService: HsMapService,
    public HsShareUrlService: HsShareUrlService,
    public HsDataVectorService: HsDataVectorService
  ) {
    this.HsMapService.loaded().then((map) => {
      this.checkUrlParamsAndAdd();
    });
  }

  checkUrlParamsAndAdd = async function () {
    const title =
      decodeURIComponent(this.HsShareUrlService.getParamValue('title')) ||
      'Layer';
    const abstract = decodeURIComponent(
      this.HsShareUrlService.getParamValue('abstract')
    );

    if (this.HsShareUrlService.getParamValue('geojson_to_connect')) {
      const url = this.HsShareUrlService.getParamValue('geojson_to_connect');
      let type = 'geojson';
      if (url.indexOf('gpx') > 0) {
        type = 'gpx';
      }
      if (url.indexOf('kml') > 0) {
        type = 'kml';
      }
      const lyr = await this.HsDataVectorService.addVectorLayer(
        type,
        url,
        title,
        title,
        abstract,
        'EPSG:4326'
      );
      this.HsDataVectorService.fitExtent(lyr);
    }

    if (this.HsShareUrlService.getParamValue('kml_to_connect')) {
      const url = this.HsShareUrlService.getParamValue('kml_to_connect');
      const lyr = await this.HsDataVectorService.addVectorLayer(
        'kml',
        url,
        title,
        title,
        abstract,
        'EPSG:4326',
        {extractStyles: true}
      );
      this.HsDataVectorService.fitExtent(lyr);
    }
  };
}
