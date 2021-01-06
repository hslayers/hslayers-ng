import * as loadingstrategy from 'ol/loadingstrategy';
import Feature from 'ol/Feature';
import {GeoJSON, WKT} from 'ol/format';
import {LineString, Point, Polygon} from 'ol/geom';
import {Vector} from 'ol/source';
import {get as getProj, transform, transformExtent} from 'ol/proj';

/**
 * DEPRECATED?
 * @deprecated
 */
export default function (options) {
  const format = new GeoJSON();
  const src = new Vector({
    format: format,
    extractStyles: options.extractStyles,
    projection: getProj(options.featureProjection),
    loader: function (extent, resolution, projection) {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          src.addFeatures(
            format.readFeatures(this.responseText, {
              dataProjection: options.dataProjection || 'EPSG:4326',
              featureProjection: options.featureProjection,
            })
          );
        } else {
          console.log('The request failed!');
        }
      };
      xhr.open('GET', options.url);
      xhr.send();
    },
    strategy: loadingstrategy.all,
    projection: options.projection,
  });
  src.options = options;
  return src;
}
