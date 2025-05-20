import {LineString, Polygon} from 'ol/geom';
import {ProjectionLike, get as getProjection, transform} from 'ol/proj';
import {getArea, getDistance} from 'ol/sphere';

import {Measurement} from 'hslayers-ng/types';

/**
 * @param url - URL for which to determine port number
 * @returns Port number
 */
export function getPortFromUrl(url: string): string {
  try {
    const link = document.createElement('a');
    link.setAttribute('href', url);
    if (link.port == '') {
      if (url.startsWith('https://')) {
        return '443';
      }
      if (url.startsWith('http://')) {
        return '80';
      }
    }
    return link.port;
  } catch (e) {
    console.error('Invalid URL provided to getPortFromUrl:', url);
    return '';
  }
}

/**
 * Parse parameters and their values from URL string
 * @param str - URL to parse parameters from
 * @returns Object with parsed parameters as properties
 */
export function getParamsFromUrl(str: string): any {
  if (typeof str !== 'string') {
    return {};
  }

  if (str.includes('?')) {
    str = str.substring(str.indexOf('?') + 1);
  } else {
    return {};
  }

  return str
    .trim()
    .split('&')
    .reduce((ret, param) => {
      if (!param) {
        return ret;
      }
      const parts = param.replace(/\+/g, ' ').split('=');
      let key = parts[0];
      let val = parts[1];
      key = decodeURIComponent(key);
      // missing `=` should be `null`:
      // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
      val = val === undefined ? null : decodeURIComponent(val);

      if (!ret.hasOwnProperty(key)) {
        ret[key] = val;
      } else if (Array.isArray(ret[key])) {
        ret[key].push(val);
      } else {
        ret[key] = [ret[key], val];
      }
      return ret;
    }, {});
}

/**
 * Create encoded URL string from object with parameters
 * @param params - Parameter object with parameter key-value pairs
 * @returns Joined encoded URL query string
 */
export function paramsToURL(params: any): string {
  const pairs = [];
  for (const key in params) {
    if (params.hasOwnProperty(key) && params[key] !== undefined) {
      pairs.push(
        encodeURIComponent(key) + '=' + encodeURIComponent(params[key]),
      );
    }
  }
  return pairs.join('&');
}

/**
 * Insert every element in the set of matched elements after the target.
 * @param newNode - Element to insert
 * @param referenceNode - Element after which to insert
 */
export function insertAfter(newNode, referenceNode): void {
  if (newNode.length !== undefined && newNode.length > 0) {
    newNode = newNode[0];
  }
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/**
 * Create URL string from object with parameters without encoding
 * @param params - Parameter object with parameter key-value pairs
 * @returns Joined URL query string
 */
export function paramsToURLWoEncode(params): string {
  const pairs = [];
  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      pairs.push(key + '=' + params[key]);
    }
  }
  return pairs.join('&');
}

/**
 * Returns a function, that, as long as it continues to be
 * invoked, will not be triggered.
 * (https://davidwalsh.name/javascript-debounce-function)
 * @param func - Function to execute with throttling
 * @param wait - The function will be called after it stops
 * being called for N milliseconds.
 * @param immediate - If `immediate` is passed, trigger the
 * function on the leading edge, instead of the trailing.
 * @param context - Context element which stores the timeout handle
 * @returns Returns function which is debounced
 */
export function debounce(func, wait: number, immediate: boolean, context) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  context ??= this;
  return function (...args) {
    const later = function () {
      if (!immediate) {
        func.apply(context, args);
      }
      context.timeout = null;
    };
    const callNow = immediate && !context.timeout;
    clearTimeout(context.timeout);
    context.timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
}

/**
 * Creates a deep copy of the input object
 * @param from - object to deep copy
 * @param to - optional target for copy
 * @returns a deep copy of input object
 */
export function structuredClone(from, to?) {
  if (from === null || typeof from !== 'object') {
    return from;
  }
  if (from.constructor != Object && from.constructor != Array) {
    return from;
  }
  if (
    from.constructor == Date ||
    from.constructor == RegExp ||
    from.constructor == Function ||
    from.constructor == String ||
    from.constructor == Number ||
    from.constructor == Boolean
  ) {
    return new from.constructor(from);
  }
  to = to || new from.constructor();
  for (const key in from) {
    to[key] =
      typeof to[key] == 'undefined' ? structuredClone(from[key]) : to[key];
  }
  return to;
}

/**
 * Check if object is a function
 * @param functionToCheck - object to check, presumably a function
 * @returns true when input is a function, false otherwise
 */
export function isFunction(functionToCheck: any): boolean {
  return (
    functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
  );
}

/**
 * Check if object is plain object (not function, not array, not class)
 
 * @returns true when input is plain old JavaScript object, false otherwise
 */
export function isPOJO(objectToCheck: any): boolean {
  return objectToCheck && {}.toString.call(objectToCheck) === '[object Object]';
}

/**
 * Check if object is an instance of a specific class
 * @param obj - any object to check
 * @param type - class type itself
 * @returns true when obj is an instance of the provided type, false otherwise
 */
export function instOf(obj: any, type: any): boolean {
  return _instanceOf(obj, type);
}

function _instanceOf(obj: any, klass: any): boolean {
  if (obj === undefined || obj === null) {
    return false;
  }
  if (klass.default) {
    klass = klass.default;
  }
  if (isFunction(klass)) {
    return obj instanceof klass;
  }
  obj = Object.getPrototypeOf(obj);
  while (obj !== null) {
    if (obj.constructor.name === klass) {
      return true;
    }
    obj = Object.getPrototypeOf(obj);
  }
  return false;
}

/**
 * Compute and format polygon area with correct units (m2/km2)
 * @returns area of polygon with used units
 */
export function formatArea(
  polygon: Polygon,
  sourceProj: ProjectionLike,
): Measurement {
  const area = Math.abs(getArea(polygon));
  const output = {
    size: area,
    type: 'Area',
    unit: 'm',
  };
  if (area > 10000) {
    output.size = Math.round((area / 1000000) * 100) / 100;
    output.unit = 'km';
  } else {
    output.size = Math.round(area * 100) / 100;
    output.unit = 'm';
  }
  return output;
}

/**
 * Compute and format line length with correct units (m/km)
 
 * @returns numeric length of line with used units
 */
export function formatLength(
  line: LineString,
  sourceProj: ProjectionLike,
): Measurement {
  let length = 0;
  const coordinates = line.getCoordinates();
  const sourceProjRegistered = getProjection(sourceProj);

  for (let i = 0; i < coordinates.length - 1; ++i) {
    const c1 = sourceProjRegistered
      ? transform(coordinates[i], sourceProj, 'EPSG:4326')
      : coordinates[i];
    const c2 = sourceProjRegistered
      ? transform(coordinates[i + 1], sourceProj, 'EPSG:4326')
      : coordinates[i + 1];
    length += getDistance(c1, c2);
  }

  const output = {
    size: length,
    type: 'Length',
    unit: 'm',
  };

  if (length > 100) {
    output.size = Math.round((length / 1000) * 100) / 100;
    output.unit = 'km';
  } else {
    output.size = Math.round(length * 100) / 100;
    output.unit = 'm';
  }
  return output;
}

/**
 * Check if element is overflown
 * @param element - Element to check
 * @returns true if element is overflown, false otherwise
 */
export function isOverflown(element: Element): boolean {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

/**
 * Replaces first string letter to UpperCase
 * @param target - Target string
 * @returns modified string
 */
export function capitalizeFirstLetter(target: string): string {
  return target.charAt(0).toUpperCase() + target.slice(1);
}

/**
 * Transforms string from camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Returns undefined if string is undefined or empty
 */
export function undefineEmptyString(str: string): any {
  if (str === undefined) {
    return undefined;
  }
  return str.trim() != '' ? str : undefined;
}
