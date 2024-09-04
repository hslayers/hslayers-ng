import {Injectable} from '@angular/core';

import {FilterType} from './filter.type';
import {HsLayerDescriptor, WfsFeatureAttribute} from 'hslayers-ng/types';

@Injectable({
  providedIn: 'root',
})
export class HsFiltersService {
  selectedLayer: HsLayerDescriptor;

  attributesExcludedFromList: string[];
  layerAttributes: WfsFeatureAttribute[] = [];

  setSelectedLayer(layer: HsLayerDescriptor): void {
    this.selectedLayer = layer;
  }

  setLayerAttributes(attributes: WfsFeatureAttribute[]): void {
    this.layerAttributes = attributes;
  }

  /**
   * Can be used to exclude attributes from the list of attributes
   * that are displayed in the comparison filter.
   */
  operators = ['==', '*=', '!=', '<', '<=', '>', '>='];

  add(type: FilterType, append: boolean, collection: any[]): void {
    let filter;
    switch (type) {
      case 'AND':
        filter = [
          '&&',
          ['==', undefined, '<value>'],
          ['==', undefined, '<value>'],
        ];
        break;
      case 'OR':
        filter = [
          '||',
          ['==', undefined, '<value>'],
          ['==', undefined, '<value>'],
        ];
        break;
      case 'COMPARE':
        filter = ['==', undefined, '<value>'];
        break;
      case 'NOT':
        filter = ['!', ['==', undefined, '<value>']];
        break;
      default:
    }
    if (append) {
      collection.push(filter);
    } else {
      collection.length = 0;
      collection.push(...filter);
    }
  }

  humanReadableLogOp(logOp: string) {
    return {'&&': 'AND', '||': 'OR', '!': 'NOT'}[logOp];
  }

  isLogOp(filters: any[]): boolean {
    return filters?.length > 0 && ['&&', '||', '!'].includes(filters[0]);
  }
}
