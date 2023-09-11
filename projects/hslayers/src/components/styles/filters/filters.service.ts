import {Injectable} from '@angular/core';
import {filterType} from './filters.component';

@Injectable({
  providedIn: 'root',
})
export class HsFiltersService {
  add(type: filterType, append: boolean, collection: any[]): void {
    let filter;
    switch (type) {
      case 'AND':
        filter = ['&&', ['==', undefined, '<value>']];
        break;
      case 'OR':
        filter = ['||', ['==', undefined, '<value>']];
        break;
      case 'COMPARE':
        filter = ['==', undefined, '<value>'];
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
    return filters?.length > 0 && ['&&', '||'].includes(filters[0]);
  }
}
