import {
  APP_BASE_HREF,
  CommonModule,
  LocationStrategy,
  PathLocationStrategy,
} from '@angular/common';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {HsLanguageModule} from '../language/language.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsShareComponent} from './share.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsShareComponent],
  imports: [CommonModule, FormsModule, HsPanelHelpersModule, HsLanguageModule],
  exports: [HsShareComponent],
  providers: [
    {provide: LocationStrategy, useClass: PathLocationStrategy},
    {provide: APP_BASE_HREF, useValue: '/'},
  ],
})
export class HsShareModule {}
