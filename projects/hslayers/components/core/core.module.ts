import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsHistoryListModule} from './../../common/history-list/history-list.module';
import {HsLayoutModule} from '../layout/layout.module';
import {HsLogModule} from '../../common/log/log.module';
import {HsMapModule} from '../map/map.module';
import {HsSidebarModule} from '../sidebar/sidebar.module';
import {HsUtilsModule} from './../utils/utils.module';
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
