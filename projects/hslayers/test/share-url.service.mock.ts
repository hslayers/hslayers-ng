import {HS_PRMS, HS_PRMS_BACKWARDS} from 'hslayers-ng/services/share';

export class HsShareUrlServiceMock {
  constructor() {}

  /**
   * @param str - Parameter string to parse
   * @returns Parsed parameter object
   * Parse parameter string from Url into key-value(s) pairs
   */
  parse(str: string): any {
    if (typeof str != 'string') {
      return {};
    }

    str = str.trim().replace(/^\?/, '');

    if (!str) {
      return {};
    }

    return str
      .trim()
      .split('&')
      .reduce((paramDict, param) => {
        const parts = param.replace(/\+/g, ' ').split('=');
        let key = parts[0];
        let val = parts[1];

        key = decodeURIComponent(key);
        // missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
        val = val == undefined ? null : decodeURIComponent(val);

        if (!paramDict.hasOwnProperty(key)) {
          paramDict[key] = val;
        } else if (Array.isArray(paramDict[key])) {
          paramDict[key].push(val);
        } else {
          paramDict[key] = [paramDict[key], val];
        }

        return paramDict;
      }, {});
  }

  getParamValue(param: string): string {
    const tmp = this.parse(location.search);
    const key = Object.keys(HS_PRMS).find((k) => HS_PRMS[k] == param);
    if (tmp[param]) {
      return tmp[param];
    } else {
      if (tmp[param] == undefined && HS_PRMS_BACKWARDS[key] != undefined) {
        return this.getParamValue(HS_PRMS_BACKWARDS[key]);
      } else {
        return;
      }
    }
  }

  getParamValues(keys: string[]): any {
    const tmp = {};
    for (const key of keys) {
      tmp[key] = this.getParamValue(key);
    }
    return tmp;
  }
}
