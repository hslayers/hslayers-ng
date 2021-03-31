import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {FilterPipe} from './filter.pipe';
import {HsUiExtensionsRecursiveDd} from './recursive-dd.component';

@NgModule({
  declarations: [
    HsUiExtensionsRecursiveDd,
    EndpointsWithDatasourcesPipe,
    FilterPipe,
  ],
  imports: [CommonModule],
  providers: [EndpointsWithDatasourcesPipe],
  entryComponents: [HsUiExtensionsRecursiveDd],
  exports: [
    HsUiExtensionsRecursiveDd,
    EndpointsWithDatasourcesPipe,
    FilterPipe,
  ],
})
export class HsUiExtensionsModule {}
