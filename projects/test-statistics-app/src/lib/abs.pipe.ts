import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'abs'})
export class AbsPipe implements PipeTransform {
  transform(num: number, args?: any): any {
    return Math.abs(num);
  }
}
