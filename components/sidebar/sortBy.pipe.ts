import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'sortBy'})
export class SortByPipe implements PipeTransform {
  transform(value: any[], order = '', column = ''): any[] {
    if (value.length <= 1) {
      return value;
    } // array with only one item
    if (order === undefined || order == '') {
      value ? (column ? this.ascendingOrder(value, column) : value) : [];
      return value;
    }
    if (column === undefined || column == '') {
      return value;
    }
    if (column || column !== '') {
      value
        ? order === 'asc'
          ? this.ascendingOrder(value, column)
          : this.descendingOrder(value, column)
        : [];
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
