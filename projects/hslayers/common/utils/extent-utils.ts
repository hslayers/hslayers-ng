import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';
import {transform} from 'ol/proj';

import {generateUuid} from 'hslayers-ng/services/utils';

/**
 * @param record - Record of one dataset from Get Records response
 * @returns
 * Create extent features for displaying extent of loaded dataset records in map
 */
export function addExtentFeature(
  record,
  mapProjection,
): Feature<Geometry> | undefined {
  const attributes = {
    hs_notqueryable: true,
    highlighted: false,
    title: record.title || record.name,
    geometry: null,
    id: generateUuid(),
  };
  let mapExtent = mapProjection.getExtent();
  if (mapExtent === null) {
    console.warn(
      'Map projection extent not found - fallback value used. To prevent unexpected results of app functionalities define it by yourself. Eg. mapExtent.setExtent([extent])',
    );
    mapProjection.setExtent(
      transformExtentValue(
        parseExtent([-180, -90, 180, 90]),
        mapProjection,
        true,
      ),
    );
    mapExtent = mapProjection.getExtent();
  }
  const recordBBox = record.bbox || record.bounding_box;
  const b = parseExtent(recordBBox || ['180', '180', '180', '180']);
  //Check if height or Width covers the whole screen
  const extent = record.bounding_box //if from layman
    ? transformExtentValue(b, mapProjection, true)
    : transformExtentValue(b, mapProjection);
  if (
    b &&
    ((extent[0] < mapExtent[0] && extent[2] > mapExtent[2]) ||
      (extent[1] < mapExtent[1] && extent[3] > mapExtent[3]))
  ) {
    return;
  }
  attributes.geometry = polygonFromExtent(extent);
  const extentFeature = new Feature(attributes);
  extentFeature.setId(extentFeature.get('id'));
  return extentFeature;
}

export function transformExtentValue(
  pairs: number[][],
  mapProjection,
  disableTransform?: boolean,
): number[] {
  if (!pairs) {
    return;
  }
  let first_pair;
  let second_pair;
  if (disableTransform) {
    (first_pair = pairs[0]), (second_pair = pairs[1]);
  } else {
    first_pair = transform(pairs[0], 'EPSG:4326', mapProjection);
    second_pair = transform(pairs[1], 'EPSG:4326', mapProjection);
  }

  const mapProjectionExtent = mapProjection.getExtent();
  if (!isFinite(first_pair[0])) {
    first_pair[0] = mapProjectionExtent[0];
  }
  if (!isFinite(first_pair[1])) {
    first_pair[1] = mapProjectionExtent[1];
  }
  if (!isFinite(second_pair[0])) {
    second_pair[0] = mapProjectionExtent[2];
  }
  if (!isFinite(second_pair[1])) {
    second_pair[1] = mapProjectionExtent[3];
  }

  if (
    isNaN(first_pair[0]) ||
    isNaN(first_pair[1]) ||
    isNaN(second_pair[0]) ||
    isNaN(second_pair[1])
  ) {
    return;
  }
  return [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
}
export function parseExtent(bbox: string | Array<number>): number[][] {
  if (!bbox) {
    return;
  }
  let b;
  const pairs = [];
  if (typeof bbox === 'string') {
    b = bbox.split(' ');
  } else if (Array.isArray(bbox)) {
    b = bbox;
  }
  pairs.push([parseFloat(b[0]), parseFloat(b[1])]);
  pairs.push([parseFloat(b[2]), parseFloat(b[3])]);
  return pairs;
}
