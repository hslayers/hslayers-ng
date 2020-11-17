import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {HsBootstrapComponent} from './bootstrap.component';
import {HsCoreModule} from './components/core';

@NgModule({
  imports: [BrowserModule, HsCoreModule],
  exports: [HsBootstrapComponent],
  declarations: [HsBootstrapComponent],
  entryComponents: [],
  providers: [],
})
export class HsAppModule {
  constructor() {}
}
