import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {HsUiExtensionsRecursiveDd} from './recursive-dd.component';
/**
 * @namespace HsUiExtensionsModule
 * @memberof hs
 */
@NgModule({
  declarations: [HsUiExtensionsRecursiveDd, EndpointsWithDatasourcesPipe],
  imports: [CommonModule],
  providers: [],
  entryComponents: [HsUiExtensionsRecursiveDd],
  exports: [HsUiExtensionsRecursiveDd, EndpointsWithDatasourcesPipe],
})
export class HsUiExtensionsModule {}
