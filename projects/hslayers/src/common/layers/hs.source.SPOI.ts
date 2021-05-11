import {SparqlJson} from './hs.source.SparqlJson';

export type SPOIOptions = {
  category: string;
  projection: string;
};

/**
 * Handy shorthand for SparqlJson source with some params pre-filled for SPOI dataset
 */
export class SPOI extends SparqlJson {
  constructor({category, projection}: SPOIOptions) {
    const options = {
      endpointUrl: 'https://www.foodie-cloud.org/sparql',
      endpointOptions: {},
      geom_attribute: '?geom',
      optimizeForVirtuoso: true,
      projection: projection,
      query: `
        PREFIX poi: <http://www.openvoc.eu/poi#>
        PREFIX spoi: <http://gis.zcu.cz/SPOI/Ontology#>
        SELECT ?o ?p ?s
        FROM <http://www.sdi4apps.eu/poi.rdf>
        WHERE {
          ?o <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> spoi:${category} .
          ?o <http://www.opengis.net/ont/geosparql#asWKT> ?geom.
          FILTER(isBlank(?geom) = false).
          <extent>
          ?o ?p ?s .
        } ORDER BY ?o`,
    };
    super(options);
  }
}
