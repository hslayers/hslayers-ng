import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfirmModule} from 'hslayers-ng/common/confirm';
import {HsHistoryListModule} from 'hslayers-ng/common/history-list';
import {HsLayoutModule} from 'hslayers-ng/components/layout/layout.module';
import {HsLogModule} from '../log/log.module';
import {HsMapModule} from 'hslayers-ng/components/map/map.module';
import {HsSidebarModule} from 'hslayers-ng/components/sidebar/sidebar.module';
import {HsUtilsModule} from '../utils/utils.module';
@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    HsLayoutModule,
    HsSidebarModule,
    HsHistoryListModule,
    HsLogModule,
    HsUtilsModule,
    HsConfirmModule,
    HsMapModule,
  ],
  exports: [],
  providers: [HsConfig],
})
export class HsCoreModule {
  constructor() {}
}
