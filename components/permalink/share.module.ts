import 'angular-cookies';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {
  CommonModule,
  HashLocationStrategy,
  LocationStrategy,
} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsShareComponent} from './share.component';
import {HsShareService} from './share.service';
import {HsShareUrlService} from './share-url.service';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';
import {WINDOW_PROVIDERS} from '../utils/window';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsShareComponent],
  imports: [CommonModule, FormsModule, HsPanelHelpersModule, TranslateModule],
  exports: [HsShareComponent],
  providers: [
    HsShareService,
    TranslateStore,
    HsShareUrlService,
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    WINDOW_PROVIDERS,
  ],
  entryComponents: [HsShareComponent],
})
export class HsShareModule {}
