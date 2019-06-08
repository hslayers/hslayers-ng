import { WKT, GeoJSON } from 'ol/format';
import { transform, transformExtent, get as getProj } from 'ol/proj';
import { Polygon, LineString, GeometryType, Point } from 'ol/geom';
import Feature from 'ol/Feature';
import { Vector } from 'ol/source';
import * as loadingstrategy from 'ol/loadingstrategy';

export default function (options) {
    var format = new GeoJSON();
    var src = new Vector({
        format: format,
        extractStyles: options.extractStyles,
        projection: getProj(options.featureProjection),
        loader: function (extent, resolution, projection) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    src.addFeatures(format.readFeatures(this.responseText, {
                        dataProjection: options.dataProjection || 'EPSG:4326',
                        featureProjection: options.featureProjection
                    }));
                } else {
                    console.log('The request failed!');
                }
            };
            xhr.open('GET', options.url);
            xhr.send();
        },
        strategy: loadingstrategy.all,
        projection: options.projection
    });
    src.options = options;
    return src;
};

