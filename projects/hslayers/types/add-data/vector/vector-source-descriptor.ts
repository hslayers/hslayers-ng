import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Vector as VectorSource} from 'ol/source';

import {HsVectorLayerOptions} from './vector-layer-options.type';
import {SparqlJson} from 'hslayers-ng/common/layers';
import {VectorSourceFromUrl} from './vector-source-from-url';

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

  constructor() {}

  /**
   * Construction method which replaces constructor method in order to allow async.
   * Should be called after common class initiation new VectorSourceDescriptor()
   */
  async init(
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

    const handlers = {
      'kml': async () => {
        const {default: KML} = await import('ol/format/KML');
        this.sourceParams.url = url;
        this.sourceParams.format = new KML({
          extractStyles: options.extractStyles,
        });
        this.sourceClass = VectorSourceFromUrl;
      },
      'geojson': async () => {
        const {default: GeoJSON} = await import('ol/format/GeoJSON');
        this.sourceParams.url = url;
        this.sourceParams.format = new GeoJSON();
        this.sourceClass = VectorSourceFromUrl;
      },
      'gpx': async () => {
        const {default: GPX} = await import('ol/format/GPX');
        this.sourceParams.url = url;
        this.sourceParams.format = new GPX();
        this.sourceClass = VectorSourceFromUrl;
      },
      'sparql': async () => {
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
      },
      'wfs': async () => {
        this.sourceClass = VectorSource;
      },
      'default': async () => {
        const {default: GeoJSON} = await import('ol/format/GeoJSON');
        this.sourceClass = VectorSource;
        const format = new GeoJSON();
        let features = options.features || [];
        if (typeof features === 'string') {
          features = format.readFeatures(options.features, {
            dataProjection: srs,
            featureProjection: this.mapProjection,
          }) as Feature[]; //FIXME: Type-cast shall be automatically inferred after OL >8.2
        }
        this.sourceParams = {
          srs,
          options,
          features,
        };
      },
    };

    const handler = handlers[type?.toLowerCase()] || handlers['default'];
    await handler.call(this);
  }
}
