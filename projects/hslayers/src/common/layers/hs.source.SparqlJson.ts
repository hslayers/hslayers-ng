import Feature from 'ol/Feature';
import {GeoJSON, WKT} from 'ol/format';
import {Point} from 'ol/geom';
import {Vector} from 'ol/source';
import {get as getProj, transform, transformExtent} from 'ol/proj';

/**
 * This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distiguishable vibrant markers in Google Maps and other apps.
 * Adam Cole, 2011-Sept-14
 * HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
 * based on http://stackoverflow.com/a/7419630
 * @param numOfSteps
 * @param step
 * @param opacity
 */
function rainbow(numOfSteps: number, step: number, opacity) {
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
 * @param feature_object
 * @param optionsCategoryField
 * @param feature
 * @param category_map
 * @param category_id
 */
function registerCategoryForStatistics(
  feature_object,
  optionsCategoryField,
  feature,
  category_map,
  category_id
) {
  if (feature_object[optionsCategoryField]) {
    if (
      typeof category_map[feature_object[optionsCategoryField]] === 'undefined'
    ) {
      category_map[feature_object[optionsCategoryField]] = {
        id: category_id,
        name: feature_object[optionsCategoryField],
      };
      category_id++;
    }
    feature.category_id = category_map[feature_object[optionsCategoryField]].id;
  }
}

/**
 * @param objects
 * @param src
 * @param options
 * @param occupied_xy
 * @param category_map
 * @param category_id
 */
function loadFeatures(
  objects,
  src,
  optionsCategoryField,
  occupied_xy,
  category_map,
  category_id,
  proj
) {
  const features = [];
  const format = new WKT();
  for (const key in objects) {
    if (
      objects[key]['http://www.w3.org/2003/01/geo/wgs84_pos#lat'] &&
      objects[key]['http://www.w3.org/2003/01/geo/wgs84_pos#long'] &&
      objects[key]['http://www.w3.org/2003/01/geo/wgs84_pos#lat'] != '' &&
      objects[key]['http://www.w3.org/2003/01/geo/wgs84_pos#long'] != ''
    ) {
      const x = parseFloat(
        objects[key]['http://www.w3.org/2003/01/geo/wgs84_pos#long']
      );
      const y = parseFloat(
        objects[key]['http://www.w3.org/2003/01/geo/wgs84_pos#lat']
      );
      if (!isNaN(x) && !isNaN(y)) {
        const coord = transform([x, y], 'EPSG:4326', 'EPSG:3857');
        if (typeof occupied_xy[coord] !== 'undefined') {
          continue;
        }
        objects[key].geometry = new Point(coord);
        const feature = new Feature(objects[key]);
        registerCategoryForStatistics(
          objects[key],
          optionsCategoryField,
          feature,
          category_map,
          category_id
        );
        occupied_xy[coord] = true;
        features.push(feature);
      }
    }
    if (objects[key]['http://www.opengis.net/ont/geosparql#asWKT']) {
      const g_feature = format.readFeature(
        objects[key]['http://www.opengis.net/ont/geosparql#asWKT'].toUpperCase()
      );
      objects[key].geometry = g_feature.getGeometry();
      objects[key].geometry.transform('EPSG:4326', proj);
      delete objects[key]['http://www.opengis.net/ont/geosparql#asWKT'];
      const coord = objects[key].geometry.getCoordinates();

      if (typeof occupied_xy[coord] !== 'undefined') {
        continue;
      }
      const feature = new Feature(objects[key]);
      registerCategoryForStatistics(
        objects[key],
        optionsCategoryField,
        feature,
        category_map,
        category_id
      );
      occupied_xy[coord] = true;
      features.push(feature);
    }
  }
  for (const categ in category_map) {
    category_map[categ].color = rainbow(
      category_id,
      category_map[categ].id,
      0.7
    );
  }
  src.legend_categories = category_map;
  for (let i = 0; i < features.length; i++) {
    if (features[i].category_id) {
      features[i].color = rainbow(category_id, features[i].category_id, 0.7);
    }
  }
  //console.log(features);
  return features;
}

/**
 * @param extend_with_attribs
 * @param objects
 */
function extendAttributes(extend_with_attribs, objects) {
  if (typeof extend_with_attribs != 'undefined') {
    for (const attr_i in extend_with_attribs) {
      for (const i in objects) {
        if (typeof objects[i][extend_with_attribs[attr_i]] == 'undefined') {
          objects[i][extend_with_attribs[attr_i]] = '';
        }
      }
    }
  }
}

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
  geom_attribute?: string;
  hsproxy?: boolean;
  /**
   * When set to true, the query will use Virtuoso's optimised "bif" functions instead of standardised GeoSPARQL functions.
   */
  optimizeForVirtuoso?: boolean;
  /**
   * EPSG code of projection
   */
  projection: string;
  /**
   * Actual SPARQL query.
   * Must contain magical keyword {@code <extent>} somewhere in the WHERE clause, which will be automagically replaced by a current extent filter.
   */
  query?: string;
  strategy?;
  /**
   * @deprecated
   * Kept only for basic backwards compatibility. You should split your 'url' param into
   * 'endpointUrl','query' and possibly 'endpointOptions', if needed.
   * TODO: remove in 5.0
   */
  url?: string;
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
  occupied_xy = {};
  /**
   * Only 'projection' and either 'url' or 'endpointUrl' + 'query' are mandatory
   */
  constructor({
    category,
    category_field,
    clear_on_move,
    endpointUrl,
    endpointOptions,
    extend_with_attribs,
    geom_attribute,
    hsproxy = false,
    optimizeForVirtuoso = false,
    projection,
    query,
    strategy,
    url,
    updates_url,
  }: SparqlOptions) {
    super({
      format: new GeoJSON(),
      loader: async function (extent, resolution, projection) {
        this.set('loaded', false);
        if (!url && !endpointUrl) {
          return;
        }
        if (endpointUrl && query) {
          const queryParts = query.split('<extent>');
          url =
            endpointUrl +
            '?query=' +
            encodeURIComponent(queryParts[0]) +
            '<extent>' +
            encodeURIComponent(queryParts[1]) +
            '&format=application%2Fsparql-results%2Bjson';
          console.log(url);
        }
        if (typeof clear_on_move !== 'undefined' && clear_on_move) {
          this.clear();
        }
        if (typeof geom_attribute === 'undefined') {
          geom_attribute = 'bif:st_point(xsd:decimal(?lon), xsd:decimal(?lat))';
        }
        let first_pair = [extent[0], extent[1]];
        let second_pair = [extent[2], extent[3]];
        first_pair = transform(first_pair, 'EPSG:3857', 'EPSG:4326');
        second_pair = transform(second_pair, 'EPSG:3857', 'EPSG:4326');
        extent = [...first_pair, ...second_pair];
        const geof = optimizeForVirtuoso
          ? 'bif:st_may_intersect'
          : 'geof:sfIntersects';
        /* Do NOT break lines in the POLYGON() section! */
        const s_extent = encodeURIComponent(
          `FILTER(${geof}(
            "POLYGON((${extent[0]} ${extent[1]}, ${extent[0]} ${extent[3]}, ${extent[2]} ${extent[3]}, ${extent[2]} ${extent[1]}, ${extent[0]} ${extent[1]}))"^^geo:wktLiteral,
          ${geom_attribute}
          )).`
        );
        const tmp = url.split('query=');
        url =
          tmp[0] +
          'query=' +
          encodeURIComponent(
            'PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n' +
              'PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n'
          ) +
          tmp[1];
        url = url.replace(/<extent>/g, s_extent);
        if (hsproxy) {
          url =
            '/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=' +
            encodeURIComponent(url);
        }
        if (console && typeof this.get('geoname') !== 'undefined') {
          console.log('Get ', this.get('geoname'));
        }
        this.loadCounter += 1;
        this.loadTotal += 1;
        console.log(url);
        const response = await fetch(url, {
          method: 'GET',
        });
        const data = await response.json();
        /*if (console) {
          console.log(
            'Finish ',
            this.get('geoname'),
            data.results.bindings.length
          );
        }*/
        this.loadCounter -= 1;
        if (updates_url) {
          let updates_query = updates_url;
          const tmp = updates_query.split('&query=');
          updates_query =
            tmp[0] +
            '&query=' +
            encodeURIComponent(
              'PREFIX geo: <http://www.opengis.net/ont/geosparql#>\n' +
                'PREFIX geof: <http://www.opengis.net/def/function/geosparql/>\n'
            ) +
            tmp[1];
          updates_query = updates_query.replace(/<extent>/g, s_extent);
          this.loadCounter += 1;
          this.loadTotal += 1;
          const response = await fetch(updates_query, {
            method: 'GET',
          });
          const updates_data = await response.json();
          if (console && typeof this.get('geoname') !== 'undefined') {
            console.log(
              'Finish updates ',
              this.get('geoname'),
              data.results.bindings.length,
              updates_data.results.bindings.length
            );
          }
          const objects = {};
          for (const item of data.results.bindings) {
            if (typeof objects[item.o.value] === 'undefined') {
              objects[item.o.value] = {
                'poi_id': item.o.value,
              };
            }
            objects[item.o.value][item.p.value] = item.s.value;
          }
          for (const item of updates_data.results.bindings) {
            let attribute_name = item.attr.value;
            //Because photos can be more than one
            if (
              typeof objects[item.o.value][attribute_name] !== 'undefined' &&
              attribute_name == 'http://xmlns.com/foaf/0.1/depiction'
            ) {
              for (let try_i = 1; try_i < 20; try_i++) {
                if (
                  typeof objects[item.o.value][attribute_name + try_i] ==
                  'undefined'
                ) {
                  attribute_name = attribute_name + try_i;
                  break;
                }
              }
            }
            objects[item.o.value][attribute_name] = item.value.value;
          }
          if (typeof category != 'undefined') {
            for (const i in objects) {
              objects[i]['http://www.sdi4apps.eu/poi/#mainCategory'] = category;
            }
          }
          extendAttributes(extend_with_attribs, objects);
          if (console) {
            console.log('Add features', objects);
          }
          this.addFeatures(
            loadFeatures(
              objects,
              this,
              category_field,
              this.occupied_xy,
              this.category_map,
              this.category_id,
              projection
            )
          );
          this.loadCounter -= 1;
          this.set('last_feature_count', Object.keys(objects).length);
          if (this.loadCounter == 0) {
            this.set('loaded', true);
            this.dispatchEvent('imageloadend');
          }
        } else {
          const objects = {};
          for (const b of data.results.bindings) {
            if (objects[b.o.value] === undefined) {
              objects[b.o.value] = {
                'poi_id': b.o.value,
              };
            }
            objects[b.o.value][b.p.value] = b.s.value;
          }
          if (typeof category !== 'undefined') {
            for (const i in objects) {
              objects[i]['http://www.sdi4apps.eu/poi/#mainCategory'] = category;
            }
          }
          extendAttributes(extend_with_attribs, objects);
          this.addFeatures(
            loadFeatures(
              objects,
              this,
              category_field,
              this.occupied_xy,
              this.category_map,
              this.category_id,
              projection
            )
          );
          this.styleAble = true;
          this.hasPoint = true;
          this.loadCounter -= 1;
          this.set('last_feature_count', Object.keys(objects).length);
          if (this.loadCounter == 0) {
            this.set('loaded', true);
            this.dispatchEvent('imageloadend');
          }
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
      projection: projection,
    });
    this.loadCounter = 0;
    this.loadTotal = 0;
    this.legend_categories = this.category_map;
  }
}

export default SparqlJson;
