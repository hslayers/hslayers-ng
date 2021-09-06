import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HsCoreModule} from '../../../hslayers/src/components/core/core.module';
import {HsLayoutModule} from '../../../hslayers/src/components/layout/layout.module';
import {HslayersAppComponent} from './hslayers-app.component';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, HsCoreModule, TranslateModule, HsLayoutModule],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
