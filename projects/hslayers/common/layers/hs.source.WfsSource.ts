import {Extent} from 'ol/extent';
import {Projection, transformExtent} from 'ol/proj';
import {Vector as VectorSource} from 'ol/source';
import {bbox, tile} from 'ol/loadingstrategy';
import {
  createGetFeatureRequest,
  createPostFeatureRequest,
} from './wfs-get-feature';
import {createXYZ} from 'ol/tilegrid';

export type WfsOptions = {
  /**
   * If proxy is necessary to use in combination with this WFS layer's server,
   * specify a path to the running instance of hslayers-server.
   * This option is independent on HsConfig.proxyPrefix and HsConfig.useProxy.
   * If left undefined or with an empty string, no proxy is used.
   */
  proxyPrefix?: string;
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
  constructor(private options: WfsOptions) {
    super({
      loader: async (extent, resolution, projection) => {
        const {
          proxyPrefix = '',
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
          ? `${proxyPrefix}${provided_url}`
          : `${proxyPrefix}${provided_url}?${createGetFeatureRequest(
              layer_name,
              data_version,
              responseFeatureCRS,
              output_format,
              transformedExtent,
              srs,
            )}`;

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
): Promise<string> {
  try {
    const options: RequestInit = {
      method: isPost ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/xml',
      },
    };

    if (isPost && featureRequest) {
      options.body = featureRequest;
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error fetching features:', error);
    throw new Error('Failed to fetch features');
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
