import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'sortBy'})
export class SortByPipe implements PipeTransform {
  transform(value: any[], order = '', column = ''): any[] {
    if (value.length <= 1) {
      return value;
    } // array with only one item
    if (order === undefined || order == '') {
      if (value && column) {
        this.ascendingOrder(value, column);
      }
      return value;
    }
    if (column === undefined || column == '') {
      return value;
    }
    if (column || column !== '') {
      if (value) {
        if (order === 'asc') {
          this.ascendingOrder(value, column);
        } else {
          this.descendingOrder(value, column);
        }
      }
      return value;
    }
    return value;
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
