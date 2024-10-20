import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'limitTo', standalone: true})
export class limitToPipe implements PipeTransform {
  transform(value: any[], limit: number): any[] {
    return value.slice(0, limit);
  }
}
