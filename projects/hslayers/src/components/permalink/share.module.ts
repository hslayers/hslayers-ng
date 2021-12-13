import {
  APP_BASE_HREF,
  CommonModule,
  LocationStrategy,
  PathLocationStrategy,
} from '@angular/common';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsShareComponent} from './share.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsShareComponent],
  imports: [CommonModule, FormsModule, HsPanelHelpersModule, TranslateModule],
  exports: [HsShareComponent],
  providers: [
    {provide: LocationStrategy, useClass: PathLocationStrategy},
    {provide: APP_BASE_HREF, useValue: '/'},
  ],
})
export class HsShareModule {}
