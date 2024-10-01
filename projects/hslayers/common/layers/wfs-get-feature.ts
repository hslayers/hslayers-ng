import {Extent} from 'ol/extent';
import {and, within} from 'ol/format/filter';
import {fromExtent} from 'ol/geom/Polygon';

/**
 * Creates a POST feature request
 */
export async function createPostFeatureRequest(
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
      getFeatureOptions['filter'] = extent
        ? and(filter, within(geometryName, fromExtent(extent), srs))
        : filter;
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
export function createGetFeatureRequest(
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
    };
    if (extent) {
      params['BBOX'] = extent.join(',') + ',' + srs;
    }
    params[data_version.startsWith('1') ? 'typeName' : 'typeNames'] =
      layer_name;

    return new URLSearchParams(params).toString();
  } catch (error) {
    console.error('Error creating GET feature request:', error);
    throw new Error('Failed to create GET feature request');
  }
}
