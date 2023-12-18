/* eslint-disable @typescript-eslint/no-unused-vars */
import {Injectable} from '@angular/core';

import {HsUtilsService} from '../../../utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsCatalogueMetadataService {
  constructor(public hsUtilsService: HsUtilsService) {}

  /**
   * @param input -
   * @param prestring -
   */
  decomposeMetadata(input, prestring?: string): any {
    if (this.hsUtilsService.isPOJO(input)) {
      return this.decomposeObject(input, prestring);
    } else if (Array.isArray(input)) {
      return this.decomposeArray(input, prestring);
    } else {
      return false;
    }
  }

  /**
   * @param obj -
   * @param substring -
   */
  decomposeObject(obj, substring?: string): any {
    let decomposed = {};
    let subvalue = undefined;
    Object.entries(obj).forEach((entry) => {
      const [key, value] = entry;
      if (key == 'feature') {
        return;
      }
      let newstring = '';
      if (substring !== undefined) {
        newstring = substring + ' - ' + key;
      } else {
        newstring = key;
      }
      if (this.hsUtilsService.isPOJO(value)) {
        subvalue = this.decomposeObject(value, newstring);
      } else if (Array.isArray(value)) {
        subvalue = this.decomposeArray(value, newstring);
      } else {
        subvalue = value;
      }
      if (this.hsUtilsService.isPOJO(subvalue)) {
        decomposed = this.hsUtilsService.structuredClone(subvalue, decomposed);
      } else {
        decomposed[newstring] = subvalue;
      }
    });
    return decomposed;
  }

  /**
   * @param arr -
   * @param substring -
   */
  decomposeArray(arr: any[], substring: string): any {
    let decomposed = undefined;
    let sub: any = '';
    arr.forEach((value) => {
      if (this.hsUtilsService.isPOJO(value)) {
        sub = this.decomposeObject(value, substring);
      } else if (Array.isArray(value)) {
        sub = this.decomposeArray(value, substring);
      } else {
        sub += value;
      }
      if (this.hsUtilsService.isPOJO(sub)) {
        decomposed = this.hsUtilsService.structuredClone(sub, decomposed);
      } else {
        decomposed[substring] = sub;
      }
    });
    return decomposed;
  }
}
