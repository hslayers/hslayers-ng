import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform(
    items: Array<any>,
    filterCallback: (item: any) => boolean,
  ): Array<any> {
    return items.filter((item) => filterCallback(item));
  }
}
