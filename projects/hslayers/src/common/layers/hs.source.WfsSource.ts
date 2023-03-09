import {HttpClient} from '@angular/common/http';

import {Geometry} from 'ol/geom';
import {Vector} from 'ol/source';
import {Vector as VectorSource} from 'ol/source';
import {WFS} from 'ol/format';
import {bbox} from 'ol/loadingstrategy';
import {lastValueFrom} from 'rxjs';
import {transformExtent} from 'ol/proj';

import {HsUtilsService} from '../../components/utils/utils.service';

export type WfsOptions = {
  data_version?: string;
  output_format?: string;
  crs?: string;
  provided_url?: string;
  layer_name?: string;
  map_projection?: any;
};

/**
 * Provides a source of features from WFS endpoint
 */
export class WfsSource extends Vector<Geometry> {
  constructor(
    hsUtilsService: HsUtilsService,
    http: HttpClient,
    {
      data_version,
      output_format,
      crs,
      provided_url,
      layer_name,
      map_projection,
    }: WfsOptions
  ) {
    super({
      loader: async function (extent, resolution, projection) {
        if (typeof data_version == 'undefined') {
          data_version = '1.0.0';
        }
        if (typeof output_format == 'undefined') {
          output_format = data_version == '1.0.0' ? 'GML2' : 'GML3';
        }
        const srs = crs.toUpperCase();
        extent = transformExtent(extent, projection.getCode(), srs);
        if (
          //https://gis.stackexchange.com/questions/30602/openlayers-wfs-flip-coordinates
          //WFS version 1.x uses lat/lon order while version 2.x uses lon/lat order
          data_version.startsWith('1') &&
          (srs.includes('4326') || srs.includes('4258'))
        ) {
          extent = [extent[1], extent[0], extent[3], extent[2]];
        }
        const params = {
          service: 'wfs',
          version: data_version, // == '2.0.0' ? '1.1.0' : data_version,
          request: 'GetFeature',
          srsName: srs,
          output_format: output_format,
          // count: layer.limitFeatureCount ? 1000 : '',
          BBOX: extent.join(',') + ',' + srs,
        };
        params[data_version.startsWith('1') ? 'typeName' : 'typeNames'] =
          layer_name;
        let url = [
          provided_url,
          hsUtilsService.paramsToURLWoEncode(params),
        ].join('?');
        url = hsUtilsService.proxify(url);
        const response = await lastValueFrom(
          http.get(url, {responseType: 'text'})
        );
        if (response) {
          const features = readFeatures(
            response,
            map_projection,
            data_version,
            srs
          );
          (this as VectorSource<Geometry>).addFeatures(features);
        }
      },
      strategy: bbox,
    });
  }
}

function readFeatures(doc, map_projection, data_version, srs) {
  const wfs = new WFS({version: data_version});
  const features = wfs.readFeatures(doc, {
    dataProjection: srs,
    featureProjection: map_projection.getCode() == srs ? '' : map_projection,
  });
  return features;
}
export default WfsSource;
