import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {FilterPipe} from './filter.pipe';
import {HsUiExtensionsRecursiveDdComponent} from './recursive-dd.component';
import {TrackByPropertyPipe} from './trackByProperty.pipe';

@NgModule({
  declarations: [
    HsUiExtensionsRecursiveDdComponent,
    EndpointsWithDatasourcesPipe,
    FilterPipe,
    TrackByPropertyPipe,
  ],
  imports: [CommonModule],
  providers: [EndpointsWithDatasourcesPipe],
  exports: [
    HsUiExtensionsRecursiveDdComponent,
    EndpointsWithDatasourcesPipe,
    FilterPipe,
    TrackByPropertyPipe,
  ],
})
export class HsUiExtensionsModule {}
