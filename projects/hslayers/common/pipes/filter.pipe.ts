import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true,
})
export class FilterPipe implements PipeTransform {
  transform(
    items: Array<any>,
    filterCallback: (item: any) => boolean,
  ): Array<any> {
    return items.filter((item) => filterCallback(item));
  }
}
