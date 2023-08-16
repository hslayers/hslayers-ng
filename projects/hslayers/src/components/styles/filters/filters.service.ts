import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsFiltersService {
  add(
    kind: 'AND' | 'OR' | 'NOT' | 'COMPARE',
    append: boolean,
    collection: any[],
  ): void {
    let filter;
    switch (kind) {
      case 'AND':
        filter = ['&&', ['==', '<attribute>', '<value>']];
        break;
      case 'OR':
        filter = ['||', ['==', '<attribute>', '<value>']];
        break;
      case 'COMPARE':
        filter = ['==', '<attribute>', '<value>'];
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
