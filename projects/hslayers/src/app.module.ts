import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HsBootstrapComponent} from './bootstrap.component';
import {HsCoreModule} from './components/core';
import { HsLayoutModule } from './components/layout';

@NgModule({
  imports: [BrowserModule, HsCoreModule, HsLayoutModule],
  exports: [HsBootstrapComponent],
  declarations: [HsBootstrapComponent],
  entryComponents: [],
  providers: [],
})
export class HsAppModule {
  constructor() {}
}
