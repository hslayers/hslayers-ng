import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'HsEndpointsForCompositionsPipe',
})
export class HsEndpointsForCompositionsPipe implements PipeTransform {
  transform(endpoints: any[], typeToFilter = 'statusmanager'): any[] {
    return endpoints.filter(ep => ep.type != 'statusmanager');
  }
}
