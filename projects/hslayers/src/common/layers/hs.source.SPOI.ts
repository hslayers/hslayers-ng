import {SparqlJson, SparqlOptions} from './hs.source.SparqlJson';

/**
 * Handy shorthand for SparqlJson source with some params pre-filled for SPOI dataset
 */
export class SPOI extends SparqlJson {
  constructor({projection}: SparqlOptions) {
    const options = {
      endpointUrl: 'https://www.foodie-cloud.org/sparql',
      endpointOptions: {},
      optimizeForVirtuoso: true,
      projection: projection,
      query: '',
    };
    super(options);
  }
}
