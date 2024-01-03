import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {HsImpressumComponent} from './impressum.component';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';
import {HsMiniSidebarComponent} from './mini-sidebar.component';
import {HsPanelHelpersModule} from 'hslayers-ng/components/layout';
import {HsSidebarComponent} from './sidebar.component';
import {SortByPipe} from './sortBy.pipe';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsImpressumComponent,
    HsMiniSidebarComponent,
    HsSidebarComponent,
    SortByPipe,
  ],
  imports: [CommonModule, HsPanelHelpersModule, TranslateCustomPipe],
  exports: [HsMiniSidebarComponent, HsSidebarComponent],
})
export class HsSidebarModule {}
