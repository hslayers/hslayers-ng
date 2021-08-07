import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {FilterPipe} from './filter.pipe';
import {HsUiExtensionsRecursiveDdComponent} from './recursive-dd.component';
@NgModule({
  declarations: [
    HsUiExtensionsRecursiveDdComponent,
    EndpointsWithDatasourcesPipe,
    FilterPipe,
  ],
  imports: [CommonModule],
  providers: [EndpointsWithDatasourcesPipe],
  entryComponents: [HsUiExtensionsRecursiveDdComponent],
  exports: [
    HsUiExtensionsRecursiveDdComponent,
    EndpointsWithDatasourcesPipe,
    FilterPipe,
  ],
})
export class HsUiExtensionsModule {}
