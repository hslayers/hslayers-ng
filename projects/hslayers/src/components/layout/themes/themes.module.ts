import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsThemeToolbarComponent} from './theme-toolbar.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsThemeToolbarComponent],
  imports: [CommonModule, NgbModule, TranslateModule],
  exports: [HsThemeToolbarComponent],
  entryComponents: [HsThemeToolbarComponent],
})
export class HsThemesModule {}
