import {
  APP_BASE_HREF,
  CommonModule,
  LocationStrategy,
  PathLocationStrategy,
} from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsShareComponent} from './share.component';
import {HsShareService} from './share.service';
import {HsShareUrlService} from './share-url.service';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsShareComponent],
  imports: [CommonModule, FormsModule, HsPanelHelpersModule, TranslateModule],
  exports: [HsShareComponent],
  providers: [
    HsShareService,
    HsShareUrlService,
    {provide: LocationStrategy, useClass: PathLocationStrategy},
    {provide: APP_BASE_HREF, useValue: '/'},
  ],
  entryComponents: [HsShareComponent],
})
export class HsShareModule {}
