import {Injectable} from '@angular/core';
import {isPOJO, structuredClone} from 'hslayers-ng/services/utils';

@Injectable({providedIn: 'root'})
export class HsCatalogueMetadataService {
  decomposeMetadata(input, prestring?: string): any {
    if (isPOJO(input)) {
      return this.decomposeObject(input, prestring);
    }
    if (Array.isArray(input)) {
      return this.decomposeArray(input, prestring);
    }
    return false;
  }

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
      if (isPOJO(value)) {
        subvalue = this.decomposeObject(value, newstring);
      } else if (Array.isArray(value)) {
        subvalue = this.decomposeArray(value, newstring);
      } else {
        subvalue = value;
      }
      if (isPOJO(subvalue)) {
        decomposed = structuredClone(subvalue, decomposed);
      } else {
        decomposed[newstring] = subvalue;
      }
    });
    return decomposed;
  }

  decomposeArray(arr: any[], substring: string): any {
    let decomposed = undefined;
    let sub: any = '';
    arr.forEach((value) => {
      if (isPOJO(value)) {
        sub = this.decomposeObject(value, substring);
      } else if (Array.isArray(value)) {
        sub = this.decomposeArray(value, substring);
      } else {
        sub += value;
      }
      if (isPOJO(sub)) {
        decomposed = structuredClone(sub, decomposed);
      } else {
        decomposed[substring] = sub;
      }
    });
    return decomposed;
  }
}
