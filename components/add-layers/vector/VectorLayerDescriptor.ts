import SparqlJson from '../../layers/hs.source.SparqlJson';
import VectorSource from 'ol/source/Vector';
import {GPX, GeoJSON, KML} from 'ol/format';
import {VectorSourceFromFeatures} from './VectorSourceFromFeatures';
import {VectorSourceFromUrl} from './VectorSourceFromUrl';

export default class {
  constructor(type, title, abstract, url, srs, options, mapProjection) {
    /**
     * Artificial object which is used when layer is saved to composition.
     * It describes format (ol.format.KML, )
     */
    const definition = {};

    this.mapProjection = mapProjection;

    this.layerParams = {
      abstract,
      definition,
      saveState: true,
      title,
      opacity: options.opacity || 1,
      from_composition: options.from_composition || false,
      style: options.style,
    };

    this.sourceParams = {
      from_composition: options.from_composition || false,
      srs,
    };

    switch (type ? type.toLowerCase() : '') {
      case 'kml':
        definition.format = 'ol.format.KML';
        definition.url = url;
        this.sourceParams.url = url;
        this.sourceParams.format = new KML({
          extractStyles: options.extractStyles,
        });
        this.sourceClass = VectorSourceFromUrl;
        break;
      case 'geojson':
        definition.format = 'ol.format.GeoJSON';
        definition.url = url;
        this.sourceParams.url = url;
        this.sourceParams.format = new GeoJSON();
        this.sourceClass = VectorSourceFromUrl;
        break;
      case 'gpx':
        definition.format = 'ol.format.GPX';
        definition.url = url;
        this.sourceParams.url = url;
        this.sourceParams.format = new GPX();
        this.sourceClass = VectorSourceFromUrl;
        break;
      case 'sparql':
        definition.format = 'hs.format.Sparql';
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
        Object.assign(this.layerParams, {
          editor: {
            editable: true,
            defaultAttributes: {
              name: title,
            },
          },
        });
        this.sourceClass = VectorSource;
        break;
      default:
        if (options.features !== undefined) {
          this.sourceClass = VectorSourceFromFeatures;
          const format = new GeoJSON();
          let features = options.features;
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
        } else {
          console.warn(`${type} not supported by hslayers`);
        }
    }
  }
}
