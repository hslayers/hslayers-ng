/* eslint-disable @typescript-eslint/no-unused-vars */
import {Injectable} from '@angular/core';

import {HsUtilsService} from '../utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsDatasourcesMetadataService {
  constructor(private hsUtilsService: HsUtilsService) {}

  /**
   * @param input
   * @param prestring
   */
  decomposeMetadata(input, prestring?: string) {
    console.log(input);
    if (this.hsUtilsService.isPOJO(input)) {
      console.log('Decomposing OBJ');
      return this.decomposeObject(input, prestring);
    } else if (Array.isArray(input)) {
      console.log('Decomposing Arr');
      return this.decomposeArray(input, prestring);
    } else {
      return false;
    }
  }

  /**
   * @param obj
   * @param substring
   */
  decomposeObject(obj, substring?: string) {
    let decomposed = {};
    let subvalue = undefined;
    Object.entries(obj).forEach((entry) => {
      const [key, value] = entry;
      console.log('deco', decomposed);
      console.log(key, value);
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
        console.log('decomposing obj ', value);
        subvalue = this.decomposeObject(value, newstring);
      } else if (Array.isArray(value)) {
        console.log('decomposing arr ', value);
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
   * @param arr
   * @param substring
   */
  decomposeArray(arr: any[], substring: string) {
    console.log('decomposing array ', arr, 'with substring ', substring);
    let decomposed = undefined;
    let sub: any = '';
    arr.forEach((value) => {
      console.log(value);
      if (this.hsUtilsService.isPOJO(value)) {
        sub = this.decomposeObject(value, substring);
      } else if (Array.isArray(value)) {
        sub = this.decomposeArray(value, substring);
      } else {
        sub += value;
      }
      console.log(sub);
      if (this.hsUtilsService.isPOJO(sub)) {
        decomposed = this.hsUtilsService.structuredClone(sub, decomposed);
      } else {
        decomposed[substring] = sub;
      }
    });
    return decomposed;
  }
}
