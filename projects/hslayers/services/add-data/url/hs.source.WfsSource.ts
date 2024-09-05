import {Extent} from 'ol/extent';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Projection, transformExtent} from 'ol/proj';
import {Vector as VectorSource} from 'ol/source';
import {and, within} from 'ol/format/filter';
import {bbox, tile} from 'ol/loadingstrategy';
import {createXYZ} from 'ol/tilegrid';
import {fromExtent} from 'ol/geom/Polygon';
import {lastValueFrom} from 'rxjs';

export type WfsOptions = {
  data_version?: string;
  output_format?: string;
  crs?: string;
  provided_url?: string;
  layer_name?: string;
  featureNS?: string;
  map_projection?: any;
  layerExtent?: Extent;
};

/**
 * Provides a source of features from WFS endpoint
 */
export class WfsSource extends VectorSource {
  constructor(
    private hsUtilsService: HsUtilsService,
    private http: HttpClient,
    private options: WfsOptions,
  ) {
    super({
      loader: async (extent, resolution, projection) => {
        const {
          data_version = '1.0.0',
          output_format = data_version === '1.0.0' ? 'GML2' : 'GML3',
          crs,
          provided_url,
          layer_name,
          featureNS,
          map_projection,
          layerExtent,
        } = this.options;

        const srs = crs.toUpperCase();
        const transformedExtent = transformExtentForWfs(
          extent,
          projection,
          srs,
          data_version,
        );
        /**
         * Use fallback 3857 instead of 4326 as
         * transformation from EPSG:4326 (to at least which was tested 3857) is seemingly not working properly.
         * lat/lon expected while getting lon/lat
         */
        const responseFeatureCRS = srs.includes('4326') ? 'EPSG:3857' : srs;

        const isPostRequest = this.get('filter');
        const url = isPostRequest
          ? /**
             * Proxify the base url or the one updated with GET paramas
             */
            this.hsUtilsService.proxify(provided_url)
          : this.hsUtilsService.proxify(
              `${provided_url}?${await createGetFeatureRequest(
                layer_name,
                data_version,
                responseFeatureCRS,
                output_format,
                transformedExtent,
                srs,
              )}`,
            );

        try {
          const response = await getFeatures(
            isPostRequest,
            url,
            isPostRequest
              ? await createPostFeatureRequest(
                  layer_name,
                  data_version,
                  responseFeatureCRS,
                  featureNS,
                  output_format,
                  transformedExtent,
                  srs,
                  this.get('filter'),
                  this.get('geometryAttribute'),
                )
              : null,
            this.http,
          );

          const features = await readFeatures(
            response,
            map_projection,
            data_version,
            responseFeatureCRS,
          );
          this.addFeatures(features);
          this.dispatchEvent('featuresloadend');
        } catch (err) {
          console.error('Error loading features:', err);
          this.dispatchEvent('featuresloaderror');
          this.removeLoadedExtent(extent);
        }
      },
      strategy: options.layerExtent
        ? tile(createXYZ({extent: options.layerExtent}))
        : bbox,
    });
  }
}

/**
 * Transforms the extent based on the projection and WFS version
 */
function transformExtentForWfs(
  extent: Extent,
  projection: Projection,
  srs: string,
  data_version: string,
): Extent {
  try {
    let transformedExtent = transformExtent(extent, projection.getCode(), srs);
    if (
      //https://gis.stackexchange.com/questions/30602/openlayers-wfs-flip-coordinates
      //WFS version 1.x uses lat/lon order while version 2.x uses lon/lat order
      data_version.startsWith('1') &&
      (srs.includes('4326') || srs.includes('4258'))
    ) {
      transformedExtent = [
        transformedExtent[1],
        transformedExtent[0],
        transformedExtent[3],
        transformedExtent[2],
      ];
    }
    return transformedExtent;
  } catch (error) {
    console.error('Error transforming extent:', error);
    throw new Error('Failed to transform extent');
  }
}

/**
 * Fetches features from the WFS server
 */
async function getFeatures(
  isPost: boolean,
  url: string,
  featureRequest: string | null,
  http: HttpClient,
): Promise<string> {
  try {
    if (isPost) {
      return lastValueFrom(
        http.post(url, featureRequest, {responseType: 'text'}),
      );
    } else {
      return lastValueFrom(http.get(url, {responseType: 'text'}));
    }
  } catch (error) {
    if (error instanceof HttpErrorResponse) {
      console.error(`HTTP error ${error.status}: ${error.message}`);
    } else {
      console.error('Error fetching features:', error);
    }
    throw new Error('Failed to fetch features');
  }
}

/**
 * Creates a POST feature request
 */
async function createPostFeatureRequest(
  layer_name: string,
  data_version: string,
  responseFeatureCRS: string,
  featureNS: string,
  output_format: string,
  extent: Extent,
  srs: string,
  filter: any,
  geometryName: string,
): Promise<string> {
  try {
    const [prefix, layerName] = layer_name.split(':');

    const {default: WFS} = await import('ol/format/WFS');
    const wfs = new WFS({version: data_version});

    const getFeatureOptions = {
      srsName: responseFeatureCRS,
      featureNS: featureNS,
      featurePrefix: prefix,
      featureTypes: [layerName],
      outputFormat: output_format,
    };

    if (filter) {
      getFeatureOptions['filter'] = and(
        filter,
        within(geometryName, fromExtent(extent), srs),
      );
    } else {
      getFeatureOptions['bbox'] = extent.join(',') + ',' + srs;
    }

    const featureRequest = wfs.writeGetFeature(getFeatureOptions);
    return new XMLSerializer().serializeToString(featureRequest);
  } catch (error) {
    console.error('Error creating POST feature request:', error);
    throw new Error('Failed to create POST feature request');
  }
}

/**
 * Creates parameters for a GET feature request
 */
function createGetFeatureRequest(
  layer_name: string,
  data_version: string,
  responseFeatureCRS: string,
  output_format: string,
  extent: Extent,
  srs: string,
): string {
  try {
    const params = {
      service: 'wfs',
      version: data_version,
      request: 'GetFeature',
      srsName: responseFeatureCRS,
      output_format: output_format,
      BBOX: extent.join(',') + ',' + srs,
    };
    params[data_version.startsWith('1') ? 'typeName' : 'typeNames'] =
      layer_name;

    return new URLSearchParams(params).toString();
  } catch (error) {
    console.error('Error creating GET feature request:', error);
    throw new Error('Failed to create GET feature request');
  }
}

/**
 * Reads features from the WFS response
 */
async function readFeatures(doc, map_projection, data_version, srs) {
  try {
    const {default: WFS} = await import('ol/format/WFS');
    const wfs = new WFS({version: data_version});
    const features = wfs.readFeatures(doc, {
      dataProjection: srs,
      featureProjection: map_projection.getCode() == srs ? '' : map_projection,
    });
    return features;
  } catch (error) {
    console.error('Error reading features:', error);
    throw new Error('Failed to read features');
  }
}

export default WfsSource;
