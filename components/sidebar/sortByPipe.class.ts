import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'sortBy'})
export class SortByPipe implements PipeTransform {
  transform(value: any[], order = '', column = ''): any[] {
    if (!value || order === '' || !order) {
      return this.ascendingOrder(value, column);
    } // no array
    if (value.length <= 1) {
      return value;
    } // array with only one item
    if (!column || column !== '') {
      if (order === 'asc') {
        return this.ascendingOrder(value, column);
      } else {
        return this.descendingOrder(value, column);
      }
    } else {
      return value;
    }
  }
  ascendingOrder(array: any, column: any): any {
    return array.sort((a, b) => {
      return a[column] - b[column];
    });
  }
  descendingOrder(array: any, column: any): any {
    return array.sort((a, b) => {
      return b[column] - a[column];
    });
  }
}
