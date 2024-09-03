import {Injectable} from '@angular/core';

import {FilterType} from './filter.type';
import {HsLayerDescriptor} from 'hslayers-ng/types';

@Injectable({
  providedIn: 'root',
})
export class HsFiltersService {
  private _selectedLayer: HsLayerDescriptor;

  setSelectedLayer(layer: HsLayerDescriptor) {
    this._selectedLayer = layer;
  }

  get selectedLayer(): HsLayerDescriptor {
    return this._selectedLayer;
  }

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
