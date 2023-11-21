import * as xml2Json from 'xml-js';
import {Feature} from 'ol';
import {GeoJSON, WKT} from 'ol/format';
import {Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

export type SparqlOptions = {
  category?: string;
  category_field?;
  clear_on_move?: boolean;
  /**
   * URL of the SPARQL endpoint
   * @example https://www.foodie-cloud.org/sparql
   */
  endpointUrl?: string;
  /**
   * Additional parametres which shall be sent to the SPARQL endpoint along with the query.
   */
  endpointOptions?;
  extend_with_attribs?;
  /**
   * Query variable (attribute) holding a unique ID of each feature.
   * It may include the leading question mark or dollar sign.
   * @default 's'
   */
  idAttribute?: string;
  /**
   * Query variable (attribute) holding the geometry of each feature.
   * It may include the leading question mark or dollar sign.
   */
  geomAttribute?: string;
  /**
   * URL of hslayers-proxy if used. Left empty if proxy is not necessary.
   */
  proxyPrefix?: string;
  /**
   * When set to 'virtuoso', the query will use Virtuoso's optimised "bif" functions instead of standardised GeoSPARQL functions.
   * When set to 'wikibase', the query will use Blazegraph & Wikibase SERVICE instead of standardised GeoSPARQL functions.
   * @default undefined
   */
  optimization?: 'virtuoso' | 'wikibase';
  /**
   * EPSG code of projection
   */
  projection: string;
  /**
   * Actual SPARQL query.
   * Must contain magical keyword <extent> somewhere in the WHERE clause, which will be automagically replaced by a current extent filter.
   */
  query?: string;
  strategy?;
  /**
   * @deprecated
   * Shorthand, which usage is discouraged. You should split your 'url' param into
   * 'endpointUrl','query' and possibly 'endpointOptions', if needed.
   */
  url?: string;
  /**
   * @deprecated
   * Was not obvious what it was good for and no use case was found.
   * If you have some, please file an issue at https://github.com/hslayers/hslayers-ng/issues
   */
  updates_url?: string;
};

/**
 * Provides a source of features from SPARQL endpoint
 */
export class SparqlJson extends Vector {
  category_map = {};
  category_id = 0;
  legend_categories;
  loadCounter: number;
  loadTotal: number;
  occupied_xy: {[coord: string]: boolean} = {};
  //What is it good for?
  styleAble: boolean;
  //What is it good for?
  hasPoint: boolean;
  /**
   * Only either 'url' or 'endpointUrl' + 'query' are mandatory
   */
  constructor({
    category,
    category_field,
    clear_on_move,
    endpointUrl,
    endpointOptions,
    extend_with_attribs,
    idAttribute,
    geomAttribute,
    proxyPrefix,
    optimization,
    projection,
    query,
    strategy,
    url,
    updates_url,
  }: SparqlOptions) {
    super({
      format: new GeoJSON(),
      loader: async (extent, resolution, projection) => {
        if (updates_url) {
          throw new Error(
            'updates_url was removed from the options as we have found no use case for it. If you have some, please file an issue at https://github.com/hslayers/hslayers-ng/issues',
          );
        }
        if (!url && (!endpointUrl || !query)) {
          throw new Error('URL or query not specified for SPARQL source');
        }
        idAttribute ??= 's';
        idAttribute = idAttribute?.trim();
        if (idAttribute.startsWith('?') || idAttribute.startsWith('$')) {
          idAttribute = idAttribute?.slice(1);
        }
        geomAttribute ??= 'geom'; //TODO: how to fallback to 'bif:st_point(xsd:decimal(?lon), xsd:decimal(?lat))' ?
        geomAttribute = geomAttribute.trim();
        if (geomAttribute.startsWith('?') || geomAttribute.startsWith('$')) {
          geomAttribute = geomAttribute.slice(1);
        }
        this.set('loaded', false);
        if (typeof clear_on_move !== 'undefined' && clear_on_move) {
          this.clear();
        }
        url = this.composeUrl({
          endpointUrl,
          query,
          geomAttribute,
          extent,
          optimization,
          proxyPrefix,
        });
        if (console && typeof this.get('geoname') !== 'undefined') {
          console.log('Get ', this.get('geoname'));
        }
        this.loadCounter += 1;
        this.loadTotal += 1;
        const response = await fetch(url, {
          headers: {
            'Accept':
              'application/sparql-results+json, application/ld+json, application/json, application/xml;q=0.9, */*;q=0.8',
          },
          method: 'GET',
        });
        let data;
        try {
          data = await response.clone().json();
        } catch (err) {
          if (console) {
            console.warn(
              'SPARQL results response not formatted as valid JSON. Trying to parse XML...',
              err,
            );
          }
        }
        if (!data) {
          try {
            data = this.xmlJson2sparqlJson(
              xml2Json.xml2js(await response.text()),
            );
          } catch (err) {
            this.dispatchEvent('featuresloaderror');
            console.error('Unable to parse SPARQL response XML!', err);
            this.set('loaded', true);
            return;
          }
        }
        /*if (console) {
          console.log(
            'Finish ',
            this.get('geoname'),
            data.results.bindings.length
          );
        }*/
        this.loadCounter -= 1;
        const objects = {};
        for (const item of data.results.bindings) {
          const id = item[idAttribute]?.value;
          if (objects[id] === undefined) {
            objects[id] = {
              'poi_id': id,
              'geom': item[geomAttribute]?.value,
            };
          }
          objects[id][item.p.value] = item.o.value;
        }
        if (typeof category !== 'undefined') {
          for (const object of Object.keys(objects)) {
            object['http://www.sdi4apps.eu/poi/#mainCategory'] = category;
          }
        }
        this.extendAttributes(extend_with_attribs, objects);
        this.addFeatures(
          this.createFeatures({
            entities: Object.values(objects),
            src: this,
            occupiedXY: this.occupied_xy,
            categoryField: category_field,
            categoryMap: this.category_map,
            categoryId: this.category_id,
            proj: projection,
          }),
        );
        this.styleAble = true;
        this.hasPoint = true;
        this.loadCounter -= 1;
        this.set('last_feature_count', Object.keys(objects).length);
        if (this.loadCounter == 0) {
          this.set('loaded', true);
          this.dispatchEvent('featuresloadend');
        }
      },
      strategy:
        strategy ??
        function (extent, resolution) {
          const tmp = [extent[0], extent[1], extent[2], extent[3]];
          if (extent[2] - extent[0] > 65735) {
            tmp[0] = (extent[2] + extent[0]) / 2.0 - 65735 / 2.0;
            tmp[2] = (extent[2] + extent[0]) / 2.0 + 65735 / 2.0;
            tmp[1] = (extent[3] + extent[1]) / 2.0 - 35000 / 2.0;
            tmp[3] = (extent[3] + extent[1]) / 2.0 + 35000 / 2.0;
          }
          return [tmp];
        },
    });
    this.loadCounter = 0;
    this.loadTotal = 0;
    this.legend_categories = this.category_map;
  }

  /**
   * @param extend_with_attribs
   * @param objects
   */
  extendAttributes(extend_with_attribs, objects) {
    if (typeof extend_with_attribs !== 'undefined') {
      for (const attr_i in extend_with_attribs) {
        for (const i in objects) {
          if (typeof objects[i][extend_with_attribs[attr_i]] === 'undefined') {
            objects[i][extend_with_attribs[attr_i]] = '';
          }
        }
      }
    }
  }

  composeUrl({
    endpointUrl,
    query,
    geomAttribute,
    extent,
    optimization,
    proxyPrefix,
  }: {
    endpointUrl: string;
    query: string;
    geomAttribute: string;
    extent: any[];
    optimization?: string;
    proxyPrefix?: string;
  }): string {
    let url = '';
    // An attempt to add missing geometry variable
    let fromIndex = query.toUpperCase().indexOf('FROM');
    if (fromIndex < 0) {
      fromIndex = query.toUpperCase().indexOf('WHERE');
    }
    const queryHead = query.slice(0, fromIndex);
    const queryBody = query.slice(fromIndex, query.length);
    if (!queryHead.includes('*') && !queryHead.includes(geomAttribute)) {
      query = `${queryHead} ?${geomAttribute} ${queryBody}`;
    }
    let queryParts: string[];
    // An attempt to fix missing filter by extent
    if (!query.includes('<extent>')) {
      const lastBraceIndex = query.lastIndexOf('}');
      queryParts = [
        query.slice(0, lastBraceIndex - 1),
        query.slice(lastBraceIndex - 1),
      ];
    } else {
      queryParts = query.split('<extent>');
    }
    url =
      endpointUrl +
      '?query=' +
      encodeURIComponent(queryParts[0]) +
      '<extent>' +
      encodeURIComponent(queryParts[1]) +
      '&format=application%2Fsparql-results%2Bjson';
    let first_pair = [extent[0], extent[1]];
    let second_pair = [extent[2], extent[3]];
    first_pair = transform(first_pair, 'EPSG:3857', 'EPSG:4326');
    second_pair = transform(second_pair, 'EPSG:3857', 'EPSG:4326');
    extent = [...first_pair, ...second_pair];
    let s_extent;
    if (optimization === 'wikibase') {
      s_extent = encodeURIComponent(`SERVICE wikibase:box {
            ?place wdt:P625 ?loc .
            bd:serviceParam wikibase:cornerWest "Point(${extent[0]} ${extent[3]})"^^geo:wktLiteral .
            bd:serviceParam wikibase:cornerEast "Point(${extent[2]} ${extent[1]})"^^geo:wktLiteral .
          }`);
    } else {
      const geof =
        optimization === 'virtuoso'
          ? 'bif:st_may_intersect'
          : 'geof:sfIntersects';
      /* Do NOT break lines in the POLYGON() section! */
      s_extent = encodeURIComponent(
        `FILTER(${geof}(
              "POLYGON((${extent[0]} ${extent[1]}, ${extent[0]} ${extent[3]}, ${extent[2]} ${extent[3]}, ${extent[2]} ${extent[1]}, ${extent[0]} ${extent[1]}))"^^geo:wktLiteral,
            ?${geomAttribute}
            )).`,
      );
    }
    const tmp = url.split('query=');
    url =
      tmp[0] +
      'query=' +
      encodeURIComponent(
        'PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n' +
          'PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n',
      ) +
      tmp[1];
    url = url.replace(/<extent>/g, s_extent);
    if (proxyPrefix) {
      url = proxyPrefix + encodeURIComponent(url);
    }
    return url;
  }

  /**
   * @param src - OL Source
   */
  createFeatures({
    entities,
    src,
    occupiedXY,
    categoryField,
    categoryMap,
    categoryId,
    proj,
  }: {
    entities: any[];
    src: SparqlJson;
    occupiedXY: {[coord: string]: boolean};
    categoryField;
    categoryMap;
    categoryId;
    proj;
  }) {
    const features = [];
    for (const entity of entities) {
      //TODO: is this first option obsolete, when the geometry must be in the geomAttribute?
      if (
        entity['http://www.w3.org/2003/01/geo/wgs84_pos#lat'] &&
        entity['http://www.w3.org/2003/01/geo/wgs84_pos#long'] &&
        entity['http://www.w3.org/2003/01/geo/wgs84_pos#lat'] != '' &&
        entity['http://www.w3.org/2003/01/geo/wgs84_pos#long'] != ''
      ) {
        const x = parseFloat(
          entity['http://www.w3.org/2003/01/geo/wgs84_pos#long'],
        );
        const y = parseFloat(
          entity['http://www.w3.org/2003/01/geo/wgs84_pos#lat'],
        );
        if (!isNaN(x) && !isNaN(y)) {
          const coord = transform([x, y], 'EPSG:4326', proj);
          if (typeof occupiedXY[coord.toString()] !== 'undefined') {
            continue;
          }
          entity.geometry = new Point(coord);
          const feature = new Feature(entity);
          this.registerCategoryForStatistics({
            featureObject: entity,
            categoryField,
            feature,
            categoryMap,
            categoryId,
          });
          occupiedXY[coord.toString()] = true;
          features.push(feature);
        }
      }
      //'http://www.opengis.net/ont/geosparql#asWKT';
      if (entity.geom) {
        const format = new WKT();
        const g_feature = format.readFeature(entity.geom.toUpperCase());
        entity.geometry = g_feature.getGeometry();
        entity.geometry.transform('EPSG:4326', proj);
        delete entity.geom;
        const coord = entity.geometry.getCoordinates();
        if (typeof occupiedXY[coord.toString()] !== 'undefined') {
          continue;
        }
        const feature = new Feature(entity);
        occupiedXY[coord] = true;
        features.push(feature);
        this.registerCategoryForStatistics({
          featureObject: entity,
          categoryField,
          feature,
          categoryMap,
          categoryId,
        });
      }
    }
    for (const category in categoryMap) {
      categoryMap[category].color = this.rainbow(
        categoryId,
        categoryMap[category].id,
        0.7,
      );
    }
    src.legend_categories = categoryMap;
    for (let i = 0; i < features.length; i++) {
      if (features[i].category_id) {
        features[i].color = this.rainbow(
          categoryId,
          features[i].category_id,
          0.7,
        );
      }
    }
    //console.log(features);
    return features;
  }

  /**
   * This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
   * Adam Cole, 2011-Sept-14
   * HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
   * based on http://stackoverflow.com/a/7419630
   * @param numOfSteps
   * @param step
   * @param opacity
   */
  rainbow(numOfSteps: number, step: number, opacity: number) {
    let r, g, b;
    const h = step / (numOfSteps * 1.00000001);
    const i = ~~(h * 4);
    const f = h * 4 - i;
    const q = 1 - f;
    switch (i % 4) {
      case 2:
        (r = f), (g = 1), (b = 0);
        break;
      case 0:
        (r = 0), (g = f), (b = 1);
        break;
      case 3:
        (r = 1), (g = q), (b = 0);
        break;
      case 1:
        (r = 0), (g = 1), (b = q);
        break;
      default:
        (r = 0), (g = 0), (b = 0);
    }
    const c =
      'rgba(' +
      ~~(r * 235) +
      ',' +
      ~~(g * 235) +
      ',' +
      ~~(b * 235) +
      ', ' +
      opacity +
      ')';
    return c;
  }

  /**
   * FIXME: What is this?
   * @param featureObject
   * @param categoryField
   * @param feature
   * @param categoryMap
   * @param categoryId
   */
  registerCategoryForStatistics({
    featureObject,
    categoryField,
    feature,
    categoryMap,
    categoryId,
  }) {
    if (featureObject[categoryField]) {
      if (typeof categoryMap[featureObject[categoryField]] === 'undefined') {
        categoryMap[featureObject[categoryField]] = {
          id: categoryId,
          name: featureObject[categoryField],
        };
        categoryId++;
      }
      feature.category_id = categoryMap[featureObject[categoryField]].id;
    }
  }

  /**
   * Converts arbitrary JSON form into a JSON compliant with a SPARQL Results JSON Spec, see https://www.w3.org/TR/sparql11-results-json/
   * @param json - Output JSON of xml-js library
   * @returns Standard-compliant SPARQL JSON
   */
  xmlJson2sparqlJson(json) {
    return {
      head: {
        vars: json.elements[0].elements
          .find((el) => el.name == 'head')
          .elements.map((variable) => variable.attributes.name),
      },
      results: {
        bindings: json.elements[0].elements
          .find((el) => el.name == 'results')
          .elements.map((result) => {
            const res = {};
            for (const binding of result.elements) {
              res[binding.attributes.name] = {
                type: binding.elements[0].name,
                datatype: binding.elements[0].attributes?.datatype,
                value: binding.elements[0].elements[0].text,
                ['xml:lang']: binding.elements[0].attributes?.['xml:lang'],
              };
            }
            return res;
          }),
      },
    };
  }
}

export default SparqlJson;
