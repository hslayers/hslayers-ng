import {Pipe, PipeTransform} from '@angular/core';

import {HsEndpoint} from '../endpoints/endpoint.interface';

@Pipe({
  name: 'endpointsWithDatasources',
})
export class EndpointsWithDatasourcesPipe implements PipeTransform {
  transform(
    endpoints: HsEndpoint[],
    typeToFilter = 'statusmanager',
    filterType = 'exclusive'
  ): HsEndpoint[] {
    switch (filterType) {
      case 'exclusive':
        return endpoints.filter((ep) => ep.type != typeToFilter);
      case 'inclusive':
        return endpoints.filter(
          (ep) => ep.type == typeToFilter || ep.type.includes(typeToFilter)
        );
      default:
        return endpoints;
    }
  }
}
