import {SparqlJson, SparqlOptions} from './hs.source.SparqlJson';

export type SPOIOptions = {
  /**
   * One of SPOI categories. Can be ONLY ONE.
   * @example 'cafe'
   */
  category: string;
  projection: string;
};

/**
 * Handy shorthand for SparqlJson source with some params pre-filled for SPOI dataset
 */
export class SPOI extends SparqlJson {
  constructor({category, projection}: SPOIOptions) {
    const options: SparqlOptions = {
      endpointUrl: 'https://www.foodie-cloud.org/sparql',
      endpointOptions: {},
      geomAttribute: '?geom',
      optimization: 'virtuoso' as const,
      projection: projection,
      query: `
        PREFIX poi: <http://www.openvoc.eu/poi#>
        PREFIX spoi: <http://gis.zcu.cz/SPOI/Ontology#>
        SELECT ?s ?p ?o
        FROM <http://www.sdi4apps.eu/poi.rdf>
        WHERE {
          ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> spoi:${category} .
          ?s <http://www.opengis.net/ont/geosparql#asWKT> ?geom.
          FILTER(isBlank(?geom) = false).
          <extent>
          ?s ?p ?o .
        } ORDER BY ?s`,
    };
    super(options);
  }
}
