import {HttpClient} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

import {LineString, Polygon} from 'ol/geom';
import {ProjectionLike, transform} from 'ol/proj';
import {getArea, getDistance} from 'ol/sphere';
import {lastValueFrom} from 'rxjs';

import {HsCommonLaymanService} from '../..//common/layman/layman.service';
import {HsConfig} from './../../config.service';
import {HsLogService} from './../../common/log/log.service';

export type Measurement = {
  size: number;
  type: string;
  unit: string;
};

@Injectable({
  providedIn: 'root',
})
export class HsUtilsService {
  constructor(
    public hsConfig: HsConfig,
    private http: HttpClient,
    private LogService: HsLogService,
    private hsCommonLaymanService: HsCommonLaymanService,
    @Inject(PLATFORM_ID) private platformId: any
  ) {}

  /**
   * Add path to proxy cgi script (hsproxy.cgi) into URL and encode rest of URL if valid HTTP URL is send and proxy use is allowed.
   * @public
   * @param url - URL to proxify
   * @param toEncoding - Optional parameter if UTF-8 encoding shouldn't be used for non-image URLs.
   * @returns Encoded Url with path to hsproxy.cgi script
   */
  proxify(url: string, toEncoding?: boolean): string {
    const laymanEp = this.hsCommonLaymanService.layman;
    if (
      url.startsWith(this.hsConfig.proxyPrefix) ||
      (laymanEp && url.startsWith(laymanEp.url))
    ) {
      return url;
    }
    if (url.startsWith('data:application')) {
      return url;
    }
    toEncoding = toEncoding === undefined ? true : toEncoding;
    let outUrl = url;
    //Not using location because don't know if port 80 was specified explicitly or not
    const windowUrlPosition = url.indexOf(window.location.origin);
    if (
      windowUrlPosition == -1 ||
      windowUrlPosition > 7 ||
      this.getPortFromUrl(url) != this.getPortFromUrl(window.location.origin)
    ) {
      if (
        this.hsConfig.useProxy === undefined ||
        this.hsConfig.useProxy === true
      ) {
        outUrl = this.hsConfig.proxyPrefix || '/proxy/';
        if (outUrl.indexOf('hsproxy.cgi') > -1) {
          if (
            toEncoding &&
            (url.indexOf('GetMap') == -1 || url.indexOf('GetFeatureInfo') > -1)
          ) {
            outUrl += 'toEncoding=utf-8&';
          }
          outUrl = outUrl + 'url=' + encodeURIComponent(url);
        } else {
          outUrl += url;
        }
      }
    }
    return outUrl;
  }

  /**
   * @public
   * @param url - URL to shorten
   * @returns Shortened URL
   * Promise which shortens URL by using some URL shortener.
   * By default tinyurl is used, but user provided function in config.shortenUrl can be used. Example: function(url) {
            return new Promise(function(resolve, reject){
                $http.get("http://tinyurl.com/api-create.php?url=" + url, {
                    longUrl: url
                }).then(function(response) {
                    resolve(response.data);
                }).catch(function(err) {
                    reject()
                })
            })
        }
   */
  async shortUrl(url: string): Promise<any> {
    if (this.hsConfig.shortenUrl != undefined) {
      return this.hsConfig.shortenUrl(url);
    }
    return await lastValueFrom(
      this.http.get(
        this.proxify('http://tinyurl.com/api-create.php?url=' + url),
        {
          responseType: 'text',
        }
      )
    );
    // return new Promise((resolve, reject) => {
    //   this.http
    //     .get(
    //       this.proxify('http://tinyurl.com/api-create.php?url=' + url, true),
    //       {
    //         longUrl: url,
    //       }
    //     )
    //     .then((response) => {
    //       resolve(response.data);
    //     })
    //     .catch((err) => {
    //       reject();
    //     });
    // });
  }

  /**
   * @param url - URL for which to determine port number
   * @returns Port number
   */
  getPortFromUrl(url: string): string {
    if (this.runningInBrowser()) {
      const link = document.createElement('a');
      link.setAttribute('href', url);
      if (link.port == '') {
        if (url.indexOf('https://') === 0) {
          return '443';
        }
        if (url.indexOf('http://') === 0) {
          return '80';
        }
      }
      return link.port;
    }
  }

  runningInBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Parse parameters and their values from URL string
   * @public
   * @param str - URL to parse parameters from
   * @returns Object with parsed parameters as properties
   */
  getParamsFromUrl(str: string): any {
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
   * Create encoded Url string from object with parameters
   * @public
   * @param {object} array - Parameter object with parameter key-value pairs
   * @returns Joined encoded URL query string
   */
  paramsToURL(array: any): string {
    const pairs = [];
    for (const key in array) {
      if (array.hasOwnProperty(key) && array[key] !== undefined) {
        pairs.push(
          encodeURIComponent(key) + '=' + encodeURIComponent(array[key])
        );
      }
    }
    return pairs.join('&');
  }

  /**
   * Insert every element in the set of matched elements after the target.
   * @public
   * @param {element} newNode - Element to insert
   * @param {element} referenceNode - Element after which to insert
   */
  insertAfter(newNode, referenceNode): void {
    if (newNode.length !== undefined && newNode.length > 0) {
      newNode = newNode[0];
    }
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  /**
   * Create URL string from object with parameters without encoding
   * @public
   * @param {object} array - Parameter object with parameter key-value pairs
   * @returns Joined URL query string
   */
  paramsToURLWoEncode(array): string {
    const pairs = [];
    for (const key in array) {
      if (array.hasOwnProperty(key)) {
        pairs.push(key + '=' + array[key]);
      }
    }
    return pairs.join('&');
  }

  /**
   * Returns a function, that, as long as it continues to be
   * invoked, will not be triggered.
   * (https://davidwalsh.name/javascript-debounce-function)
   * @public
   * @param {Function} func - Function to execute with throttling
   * @param wait - The function will be called after it stops
   * being called for N milliseconds.
   * @param immediate - If `immediate` is passed, trigger the
   * function on the leading edge, instead of the trailing.
   * @param {object} context - Context element which stores the timeout handle
   * @returns {Function} Returns function which is debounced
   */
  debounce(func, wait: number, immediate: boolean, context) {
    if (context === undefined) {
      context = this;
    }
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
   * Generate randomized UUID
   * @public
   * @returns Random uuid
   */
  generateUuid(): string {
    return generateUuid();
  }

  /**
   * Generates CSS color string (rgba(0, 0, 0, 1)) from given range and value for which to have color
   * @public
   * @param numOfSteps - Maximum value which is the last color in rainbow
   * @param step - Current value to get color for
   * @param opacity - Opacity from 0 to 1
   * @returns CSS color
   */
  rainbow(numOfSteps: number, step: number, opacity: number | string): string {
    // based on http://stackoverflow.com/a/7419630
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
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
   * Creates a deep copy of the input object
   * @param {object} from object to deep copy
   * @param {object?} to optional target for copy
   * @returns a deep copy of input object
   */
  structuredClone(from, to?) {
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
        typeof to[key] == 'undefined'
          ? this.structuredClone(from[key])
          : to[key];
    }
    return to;
  }

  /**
   * Check if object is a function
   * @param functionToCheck
   * @returns true when input is a function, false otherwise
   */
  isFunction(functionToCheck: any): boolean {
    return isFunction(functionToCheck);
  }

  /**
   * Check if object is plain object (not function, not array, not class)
   * @param objectToCheck
   * @returns true when input is plain old JavaScript object, false otherwise
   */
  isPOJO(objectToCheck: any): boolean {
    return (
      objectToCheck && {}.toString.call(objectToCheck) === '[object Object]'
    );
  }

  /**
   * Remove duplicate items from an array
   * @param {Array<object>} dirtyArray Array with possible duplicate objects
   * @param property - Property of objects which must be unique in the new array.
   * Use dot symbol (".") to denote a property chain in nested object.
   * Function will return an empty array if it won't find the property in the object.
   * @returns {Array<object>} Array without duplicate objects
   */
  removeDuplicates(dirtyArray: any, property: string): any {
    const propertyChain = property.split('.');
    const flatArray = [...dirtyArray];
    for (const prop of propertyChain) {
      for (const idx in flatArray) {
        if (flatArray[idx] === undefined) {
          this.LogService.error(`Property "${prop}" not found in object.`);
          return [];
        }
        flatArray[idx] =
          flatArray[idx].get !== undefined
            ? flatArray[idx].get(
                prop
              ) /* get() is only defined for OL objects */
            : flatArray[idx][prop]; /* POJO access */
      }
    }
    return dirtyArray.filter((item, position) => {
      let propertyValue = item;
      for (const prop of propertyChain) {
        propertyValue =
          propertyValue.get !== undefined
            ? propertyValue.get(prop) /* get() is only defined for OL objects */
            : propertyValue[prop]; /* POJO access */
      }
      return flatArray.indexOf(propertyValue) === position;
    });
  }

  hashCode(s: string): number {
    let hash = 0;
    if (s.length == 0) {
      return hash;
    }
    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Replaces input string text with replacement text
   * @public
   * @param target - Target string
   * @param search - String to look for
   * @param replacement - Replacement value
   * @returns Returns modified string
   */
  replaceAll(target: string, search: string, replacement: string): string {
    return target.replace(new RegExp(search, 'g'), replacement);
  }

  resolveEsModule(module) {
    if (module.default) {
      return module.default;
    } else {
      return module;
    }
  }

  /**
   * Replaces first string letter to UpperCase
   * @public
   * @param target - Target string
   * @returns modified string
   */
  capitalizeFirstLetter(target: string): string {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }

  undefineEmptyString(str: string): any {
    if (str === undefined) {
      return undefined;
    }
    return str.trim() != '' ? str : undefined;
  }

  isOverflown(element: Element): boolean {
    return (
      element.scrollHeight > element.clientHeight ||
      element.scrollWidth > element.clientWidth
    );
  }

  /**
   * @private
   * @param {LineString} line
   * @returns {Measurement} numeric length of line with used units
   * @description Compute and format line length with correct units (m/km)
   */
  formatLength(line: LineString, sourceProj: ProjectionLike): Measurement {
    let length = 0;
    const coordinates = line.getCoordinates();

    for (let i = 0; i < coordinates.length - 1; ++i) {
      const c1 = transform(coordinates[i], sourceProj, 'EPSG:4326');
      const c2 = transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
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

  instOf(obj: any, type: any): boolean {
    return instOf(obj, type);
  }

  /**
   * @private
   * @param {Polygon} polygon
   * @returns {object} area of polygon with used units
   * @description Compute and format polygon area with correct units (m2/km2)
   */
  formatArea(polygon: Polygon, sourceProj: ProjectionLike): Measurement {
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
}

export function generateUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
