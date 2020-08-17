import * as angular from 'angular';
import {DOCUMENT} from '@angular/common';
import {HsConfig} from './../../config.service';
import {HsLogService} from './../../common/log/log.service';
import {HttpClient} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {WINDOW} from '../utils/window';

@Injectable()
export class HsUtilsService {
  constructor(
    private HsConfig: HsConfig,
    private http: HttpClient,
    @Inject(WINDOW) private window: Window,
    @Inject(DOCUMENT) private document: Document,
    private LogService: HsLogService
  ) {}
  /**
   * @ngdoc method
   * @name HsUtilsService#proxify
   * @public
   * @param {string} url Url to proxify
   * @param {boolean} toEncoding Optional parameter if UTF-8 encoding shouldn´t be used for non-image Urls.
   * @returns {string} Encoded Url with path to hsproxy.cgi script
   * @description Add path to proxy cgi script (hsproxy.cgi) into Url and encode rest of Url if valid http Url is send and proxy use is allowed.
   */
  proxify(url: string, toEncoding?: boolean): string {
    if (url.startsWith(this.HsConfig.proxyPrefix)) {
      return url;
    }
    toEncoding = angular.isUndefined(toEncoding) ? true : toEncoding;
    let outUrl = url;
    //Not using location because don't know if port 80 was specified explicitly or not
    const windowUrlPosition = url.indexOf(this.window.location.origin);
    if (
      windowUrlPosition == -1 ||
      windowUrlPosition > 7 ||
      this.getPortFromUrl(url) != this.window.location.port
    ) {
      if (
        angular.isUndefined(this.HsConfig.useProxy) ||
        this.HsConfig.useProxy === true
      ) {
        outUrl = this.HsConfig.proxyPrefix || '/cgi-bin/hsproxy.cgi?';
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
   * @ngdoc method
   * @name HsUtilsService#shortUrl
   * @public
   * @param {string} url Url to shorten
   * @returns {string} Shortened url
   * @description Promise which shortens url by using some url shortener.
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
  shortUrl(url: string): any {
    if (this.HsConfig.shortenUrl != undefined) {
      return this.HsConfig.shortenUrl(url);
    }
    return this.http.get(
      this.proxify('http://tinyurl.com/api-create.php?url=' + url)
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
   * @ngdoc method
   * @name HsUtilsService#getPortFromUrl
   * @param {string} url Url for which to determine port number
   * @returns {string} Port number
   */
  getPortFromUrl(url: string): string {
    const link = this.document.createElement('a');
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

  /**
   * @ngdoc method
   * @name HsUtilsService#getParamsFromUrl
   * @public
   * @param {string} str Url to parse for parameters
   * @returns {object} Object with parsed parameters as properties
   * @description Parse parameters and their values from Url string
   */
  getParamsFromUrl(str: string): any {
    if (!angular.isString(str)) {
      return {};
    }

    if (str.indexOf('?') > -1) {
      str = str.substring(str.indexOf('?') + 1);
    } else {
      return {};
    }

    return str
      .trim()
      .split('&')
      .reduce((ret, param) => {
        if (!param) {
          return {};
        }
        const parts = param.replace(/\+/g, ' ').split('=');
        let key = parts[0];
        let val = parts[1];
        key = decodeURIComponent(key);
        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = angular.isUndefined(val) ? null : decodeURIComponent(val);

        if (!ret.hasOwnProperty(key)) {
          ret[key] = val;
        } else if (angular.isArray(ret[key])) {
          ret[key].push(val);
        } else {
          ret[key] = [ret[key], val];
        }
        return ret;
      }, {});
  }

  /**
   * @ngdoc method
   * @name HsUtilsService#paramsToUrl
   * @public
   * @param {object} array Parameter object with parameter key-value pairs
   * @returns {string} Joined encoded Url query string
   * @description Create encoded Url string from object with parameters
   */
  paramsToURL(array: any): string {
    const pairs = [];
    for (const key in array) {
      if (array.hasOwnProperty(key) && angular.isDefined(array[key])) {
        pairs.push(
          encodeURIComponent(key) + '=' + encodeURIComponent(array[key])
        );
      }
    }
    return pairs.join('&');
  }

  /**
   * @ngdoc method
   * @name HsUtilsService#insertAfter
   * @public
   * @param {element} newNode Element to insert
   * @param {element} referenceNode Element after which to insert
   * @description Insert every element in the set of matched elements after the target.
   */
  insertAfter(newNode, referenceNode): void {
    if (angular.isDefined(newNode.length) && newNode.length > 0) {
      newNode = newNode[0];
    }
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  /**
   * @ngdoc method
   * @name HsUtilsService#paramsToUrlWoEncode
   * @public
   * @param {object} array Parameter object with parameter key-value pairs
   * @returns {string} Joined Url query string
   * @description Create Url string from object with parameters without encoding
   */
  paramsToURLWoEncode(array: Array<string>): string {
    const pairs = [];
    for (const key in array) {
      if (array.hasOwnProperty(key)) {
        pairs.push(key + '=' + array[key]);
      }
    }
    return pairs.join('&');
  }

  /**
   * @ngdoc method
   * @name HsUtilsService#debounce
   * @public
   * @param {Function} func Function to execute with throttling
   * @param {number} wait  The function will be called after it stops
   * being called for N milliseconds.
   * @param {boolean} immediate If `immediate` is passed, trigger the
   * function on the leading edge, instead of the trailing.
   * @param {object} context Context element which stores the timeout handle
   * @returns {Function} Returns function which is debounced
   * @description Returns a function, that, as long as it continues to be
   * invoked, will not be triggered.
   * (https://davidwalsh.name/javascript-debounce-function)
   */
  debounce(func, wait, immediate, context) {
    if (angular.isUndefined(context)) {
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
      // eslint-disable-next-line angular/timeout-service
      context.timeout = setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args);
      }
    };
  }

  /**
   * @ngdoc method
   * @name HsUtilsService#generateUuid
   * @public
   * @returns {string} Random uuid
   * @description Generate randomized uuid
   */
  generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * @ngdoc method
   * @name HsUtilsService#rainbow
   * @public
   * @param {number} numOfSteps Maximum value which is the last color in rainbow
   * @param {number} step Current value to get color for
   * @param {number} opacity Opacity from 0 to 1
   * @returns {string} CSS color
   * @description Generates css color string (rgba(0, 0, 0, 1)) from given range and value for which to have color
   */
  rainbow(numOfSteps: number, step: number, opacity: string): string {
    // based on http://stackoverflow.com/a/7419630
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distiguishable vibrant markers in Google Maps and other apps.
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
   * Check if object is a function
   *
   * @param {object} functionToCheck
   * @returns {boolean}
   */
  isFunction(functionToCheck: any): boolean {
    return (
      functionToCheck &&
      {}.toString.call(functionToCheck) === '[object Function]'
    );
  }

  /**
   * Check if object is an instance of a class
   *
   * @param {object} obj
   * @param {*} type
   * @returns {boolean}
   */
  instOf(obj: any, type: any): boolean {
    return this._instanceOf(obj, type);
  }

  _instanceOf(obj: any, klass: any): boolean {
    if (this.isFunction(klass)) {
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
  //Not being user anywere and probably wont be needed at all
  // injectService(name: string): any {
  //   return new Promise((resolve, reject) => {
  //     try {
  //       const tmp = this.$injector.get(name);
  //       resolve(tmp);
  //     } catch (ex) {
  //       let tries = 0;
  //       const clear = setInterval(() => {
  //         try {
  //           tries++;
  //           const tmp = this.$injector.get(name);
  //           clearInterval(clear);
  //           resolve(tmp);
  //         } catch (ex2) {
  //           if (tries > 10) {
  //             this.LogService.log(
  //               'Failed to get service in HsUtilsService.injectService',
  //               name,
  //               ex2
  //             );
  //             clearInterval(clear);
  //             reject(ex);
  //           }
  //         }
  //       }, 500);
  //     }
  //   });
  // }

  /**
   * Remove duplicate items from an array
   *
   * @param {Array<object>} dirtyArray Array with possible duplicate objects
   * @param {string} property Property of objects which must be unique in the new array.
   * Use dot symbol (".") to denote a property chain in nested object.
   * Function will return an empty array if it won't find the property in the object.
   * @returns {Array<object>} Array without duplicate objects
   */
  removeDuplicates(dirtyArray: any, property: string): any {
    const propertyChain = property.split('.');
    const flatArray = [...dirtyArray];
    for (const prop of propertyChain) {
      for (const idx in flatArray) {
        if (angular.isUndefined(flatArray[idx])) {
          this.LogService.error(`Property "${prop}" not found in object.`);
          return [];
        }
        flatArray[idx] = angular.isDefined(flatArray[idx].get)
          ? flatArray[idx].get(prop) /* get() is only defined for OL objects */
          : flatArray[idx][prop]; /* POJO access */
      }
    }
    return dirtyArray.filter((item, position) => {
      let propertyValue = item;
      for (const prop of propertyChain) {
        propertyValue = angular.isDefined(propertyValue.get)
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
}
