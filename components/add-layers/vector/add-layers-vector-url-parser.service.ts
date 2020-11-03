import '../../styles/styles.module';
import {HsAddLayersVectorService} from './add-layers-vector.service';
import {HsMapService} from '../../map/map.service';
import {HsShareUrlService} from '../../permalink/share-url.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsVectorUrlParserService {
  constructor(
    private HsMapService: HsMapService,
    private HsShareUrlService: HsShareUrlService,
    private HsAddLayersVectorService: HsAddLayersVectorService
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
      const lyr = await this.HsAddLayersVectorService.addVectorLayer(
        type,
        url,
        title,
        abstract,
        'EPSG:4326'
      );
      this.HsAddLayersVectorService.fitExtent(lyr);
    }

    if (this.HsShareUrlService.getParamValue('kml_to_connect')) {
      const url = this.HsShareUrlService.getParamValue('kml_to_connect');
      const lyr = await this.HsAddLayersVectorService.addVectorLayer(
        'kml',
        url,
        title,
        abstract,
        'EPSG:4326',
        {extractStyles: true}
      );
      this.HsAddLayersVectorService.fitExtent(lyr);
    }
  };
}
