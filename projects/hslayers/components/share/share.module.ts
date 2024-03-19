import {
  APP_BASE_HREF,
  CommonModule,
  LocationStrategy,
  PathLocationStrategy,
} from '@angular/common';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {HsPanelHeaderComponent} from 'hslayers-ng/common/panels';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsShareComponent} from './share.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsShareComponent],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateCustomPipe,
    HsPanelHeaderComponent,
  ],
  exports: [HsShareComponent],
  providers: [
    {provide: LocationStrategy, useClass: PathLocationStrategy},
    {provide: APP_BASE_HREF, useValue: '/'},
  ],
})
export class HsShareModule {}
