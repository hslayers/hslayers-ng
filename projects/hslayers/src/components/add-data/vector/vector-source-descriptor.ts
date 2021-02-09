import Feature from 'ol/Feature';
import SparqlJson from '../../../common/layers/hs.source.SparqlJson';
import VectorSource from 'ol/source/Vector';
import {GPX, GeoJSON, KML} from 'ol/format';
import {HsVectorLayerOptions} from './vector-layer-options.type';
import {VectorSourceFromFeatures} from './VectorSourceFromFeatures';
import {VectorSourceFromUrl} from './VectorSourceFromUrl';
export class VectorSourceDescriptor {
  mapProjection;
  sourceParams: {
    extractStyles?: any;
    from_composition?: boolean;
    srs?: any;
    url?: string;
    format?: any;
    geom_attribute?: string;
    options?: HsVectorLayerOptions;
    category_field?: string;
    projection?: any;
    minResolution?: number;
    maxResolution?: number;
    features?: Feature[];
  };
  sourceClass:
    | typeof VectorSourceFromUrl
    | typeof VectorSourceFromFeatures
    | typeof SparqlJson
    | typeof VectorSource;

  constructor(
    type: string,
    url: string,
    srs,
    options: HsVectorLayerOptions,
    mapProjection
  ) {
    this.mapProjection = mapProjection;

    this.sourceParams = {
      from_composition: options.from_composition || false,
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
          geom_attribute: '?geom',
          url: url,
          category_field: 'http://www.openvoc.eu/poi#categoryWaze',
          projection: 'EPSG:3857',
          minResolution: 1,
          maxResolution: 38,
          //#####feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
        };
        this.sourceClass = SparqlJson;
        break;
      case 'wfs':
        this.sourceClass = VectorSource;
        break;
      default:
        this.sourceClass = VectorSourceFromFeatures;
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
