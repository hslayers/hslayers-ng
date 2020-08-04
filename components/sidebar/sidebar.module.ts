import '../core/';
import '../layout';
import '../map/map.module';
import '../permalink/permalink.module';
import 'angular-cookies';
import {BrowserModule} from '@angular/platform-browser';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {HsSidebarComponent} from './sidebar.component';
import {HsSidebarMiniComponent} from './sidebar-mini.component';
import {HsSidebarService} from './sidebar.service';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {SortByPipe} from './sortByPipe.class';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsSidebarMiniComponent, HsSidebarComponent, SortByPipe],
  imports: [BrowserModule, NgbModule],
  exports: [HsSidebarMiniComponent, HsSidebarComponent],
  providers: [HsSidebarService],
  entryComponents: [HsSidebarMiniComponent, HsSidebarComponent],
})
export class HsSidebarModule {}
