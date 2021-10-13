import {Injectable} from '@angular/core';

import {HsAddDataVectorService} from './vector.service';
import {HsMapService} from '../../map/map.service';
import {HsShareUrlService} from '../../permalink/share-url.service';

@Injectable({
  providedIn: 'root',
})
export class HsVectorUrlParserService {
  constructor(
    public hsMapService: HsMapService,
    public hsShareUrlService: HsShareUrlService,
    public hsAddDataVectorService: HsAddDataVectorService
  ) {
    this.hsMapService.loaded().then((map) => {
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
      const lyr = await this.HsAddDataVectorService.addVectorLayer(
        type,
        url,
        title,
        title,
        abstract,
        'EPSG:4326'
      );
      this.HsAddDataVectorService.fitExtent(lyr);
    }

    if (this.HsShareUrlService.getParamValue('kml_to_connect')) {
      const url = this.HsShareUrlService.getParamValue('kml_to_connect');
      const lyr = await this.HsAddDataVectorService.addVectorLayer(
        'kml',
        url,
        title,
        title,
        abstract,
        'EPSG:4326',
        {extractStyles: true}
      );
      this.HsAddDataVectorService.fitExtent(lyr);
    }
  };
}
