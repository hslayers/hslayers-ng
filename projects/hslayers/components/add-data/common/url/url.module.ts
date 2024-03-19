import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {EpsgPipe, TrackByPropertyPipe} from 'hslayers-ng/common/pipes';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsCommonUrlComponent} from './url.component';
import {HsHistoryListModule} from 'hslayers-ng/common/history-list';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {HsUrlAddComponent} from './add/add.component';
import {HsUrlDetailsComponent} from './details/details.component';
import {HsUrlProgressComponent} from './progress/progress.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsHistoryListModule,
    HsAddToMapButtonComponent,
    EpsgPipe,
    TrackByPropertyPipe,
    HsLayerTableComponent,
  ],
  exports: [
    HsUrlAddComponent,
    HsUrlProgressComponent,
    HsCommonUrlComponent,
    HsUrlDetailsComponent,
  ],
  declarations: [
    HsUrlAddComponent,
    HsUrlProgressComponent,
    HsCommonUrlComponent,
    HsUrlDetailsComponent,
  ],
})
export class HsCommonUrlModule {}
