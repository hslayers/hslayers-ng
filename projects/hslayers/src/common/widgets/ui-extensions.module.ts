import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {CallbackFilterPipe} from './callback.pipe';
import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {HsUiExtensionsRecursiveDd} from './recursive-dd.component';

@NgModule({
  declarations: [
    HsUiExtensionsRecursiveDd,
    EndpointsWithDatasourcesPipe,
    CallbackFilterPipe,
  ],
  imports: [CommonModule],
  providers: [EndpointsWithDatasourcesPipe, CallbackFilterPipe],
  entryComponents: [HsUiExtensionsRecursiveDd],
  exports: [
    HsUiExtensionsRecursiveDd,
    EndpointsWithDatasourcesPipe,
    CallbackFilterPipe,
  ],
})
export class HsUiExtensionsModule {}
