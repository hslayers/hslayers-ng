import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'endpointsWithDatasources',
})
export class EndpointsWithDatasourcesPipe implements PipeTransform {
  transform(
    endpoints: any[],
    typeToFilter = 'statusmanager',
    filterType = 'exclusive'
  ): any[] {
    switch (filterType) {
      case 'exclusive':
        return endpoints.filter((ep) => ep.type != typeToFilter);
      case 'inclusive':
        return endpoints.filter((ep) => ep.type == typeToFilter);
      default:
        return endpoints;
    }
  }
}
