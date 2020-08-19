import 'angular-cookies';
import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {HsMiniSidebarComponent} from './mini-sidebar.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSidebarComponent} from './sidebar.component';
import {HsSidebarService} from './sidebar.service';
import {SortByPipe} from './sortByPipe.class';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsMiniSidebarComponent, HsSidebarComponent, SortByPipe],
  imports: [BrowserModule, HsPanelHelpersModule],
  exports: [HsMiniSidebarComponent, HsSidebarComponent],
  providers: [HsSidebarService],
  entryComponents: [HsMiniSidebarComponent, HsSidebarComponent],
})
export class HsSidebarModule {}
