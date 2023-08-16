//@ https://www.bennadel.com/blog/3579-using-pure-pipes-to-generate-ngfor-trackby-identity-functions-in-angular-7-2-7.html
import {Pipe, PipeTransform} from '@angular/core';
interface TrackByFunctionCache {
  [propertyName: string]: <T>(index: number, item: T) => any;
}
const cache: TrackByFunctionCache = {};
@Pipe({
  name: 'trackByProperty',
  pure: true,
})
export class TrackByPropertyPipe implements PipeTransform {
  public transform(propertyName: string) {
    if (!cache[propertyName]) {
      cache[propertyName] = function trackByProperty<T>(
        index: number,
        item: T,
      ): any {
        return item[propertyName];
      };
    }
    return cache[propertyName];
  }
}
