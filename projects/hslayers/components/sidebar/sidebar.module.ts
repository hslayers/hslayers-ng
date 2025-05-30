import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {HsImpressumComponent} from './impressum.component';
import {HsMiniSidebarComponent} from './mini-sidebar.component';
import {HsPanelHelpersModule} from 'hslayers-ng/common/panels';
import {HsSidebarComponent} from './sidebar.component';
import {SortByPipe} from './sortBy.pipe';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsMiniSidebarComponent, HsSidebarComponent, SortByPipe],
  imports: [
    CommonModule,
    HsPanelHelpersModule,
    TranslateCustomPipe,
    HsImpressumComponent,
  ],
  exports: [HsMiniSidebarComponent, HsSidebarComponent],
})
export class HsSidebarModule {}
