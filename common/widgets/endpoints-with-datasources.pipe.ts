import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'endpointsWithDatasources',
})
export class EndpointsWithDatasourcesPipe implements PipeTransform {
  transform(endpoints: any[], typeToFilter = 'statusmanager'): any[] {
    return endpoints.filter((ep) => ep.type != typeToFilter);
  }
}
