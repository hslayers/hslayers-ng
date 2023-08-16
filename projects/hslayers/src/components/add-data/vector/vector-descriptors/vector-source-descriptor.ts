import Feature from 'ol/Feature';
import {GPX, GeoJSON, KML} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Vector as VectorSource} from 'ol/source';

import {HsVectorLayerOptions} from '../vector-layer-options.type';
import {SparqlJson} from '../../../../common/layers/hs.source.SparqlJson';
import {VectorSourceFromUrl} from '../vector-source-from-url';

export class VectorSourceDescriptor {
  mapProjection;
  sourceParams: {
    extractStyles?: any;
    fromComposition?: boolean;
    srs?: any;
    url?: string;
    endpointUrl?: string;
    query?: string;
    optimization?: string;
    format?: any;
    geomAttribute?: string;
    idAttribute?: string;
    options?: HsVectorLayerOptions;
    category_field?: string;
    projection?: any;
    minResolution?: number;
    maxResolution?: number;
    features?: Feature<Geometry>[];
  };
  sourceClass:
    | typeof VectorSourceFromUrl
    | typeof SparqlJson
    | typeof VectorSource;

  constructor(
    type: string,
    url: string,
    srs,
    options: HsVectorLayerOptions,
    mapProjection,
  ) {
    this.mapProjection = mapProjection;

    this.sourceParams = {
      fromComposition: options.fromComposition || false,
      srs,
    };

    switch (type ? type.toLowerCase() : '') {
      case 'kml':
        this.sourceParams.url = url;
        this.sourceParams.format = new KML({
          extractStyles: options.extractStyles,
        });
        this.sourceClass = VectorSourceFromUrl;
        break;
      case 'geojson':
        this.sourceParams.url = url;
        this.sourceParams.format = new GeoJSON();
        this.sourceClass = VectorSourceFromUrl;
        break;
      case 'gpx':
        this.sourceParams.url = url;
        this.sourceParams.format = new GPX();
        this.sourceClass = VectorSourceFromUrl;
        break;
      case 'sparql':
        this.sourceParams = {
          geomAttribute: options.geomAttribute ?? '?geom',
          idAttribute: options.idAttribute,
          url: url.includes('=') ? url : null,
          endpointUrl: url,
          query: options.query,
          category_field:
            url.includes('foodie-cloud') || url.includes('plan4all')
              ? 'http://www.openvoc.eu/poi#categoryWaze'
              : null,
          optimization: url.includes('wikidata') ? 'wikibase' : undefined,
          projection: 'EPSG:3857',
          minResolution: 1,
          maxResolution: 38,
        };
        this.sourceClass = SparqlJson;
        break;
      case 'wfs':
        this.sourceClass = VectorSource;
        break;
      default:
        this.sourceClass = VectorSource;
        const format = new GeoJSON();
        let features = options.features || [];
        if (typeof features === 'string') {
          features = format.readFeatures(options.features, {
            dataProjection: srs,
            featureProjection: this.mapProjection,
          });
        }
        this.sourceParams = {
          srs,
          options,
          features,
        };
    }
  }
}
