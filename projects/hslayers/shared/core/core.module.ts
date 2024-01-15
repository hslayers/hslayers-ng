import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsConfirmModule} from 'hslayers-ng/common/confirm';
import {HsHistoryListModule} from 'hslayers-ng/common/history-list';
import {HsLayoutModule} from 'hslayers-ng/components/layout';
import {HsMapModule} from 'hslayers-ng/components/map';
import {HsSidebarModule} from 'hslayers-ng/components/sidebar';

/**
 * This most likely wont be necessary at all
 */

@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    HsLayoutModule,
    HsSidebarModule,
    HsHistoryListModule,
    HsConfirmModule,
    HsMapModule,
  ],
  exports: [],
  providers: [HsConfig],
})
export class HsCoreModule {
  constructor() {}
}