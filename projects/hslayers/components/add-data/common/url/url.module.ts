import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslatePipe} from '@ngx-translate/core';

import {EpsgPipe, TrackByPropertyPipe} from 'hslayers-ng/common/pipes';
import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsCommonUrlComponent} from './url.component';
import {HsHistoryListModule} from 'hslayers-ng/common/history-list';
import {HsLayerTableComponent} from 'hslayers-ng/common/layer-table';
import {HsUrlAddComponent} from './add/add.component';
import {HsUrlDetailsComponent} from './details/details.component';
import {HsUrlProgressComponent} from './progress/progress.component';
import {HsAddUrlAsToggleComponent} from './add-as-toggle/add-as-toggle.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslatePipe,
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
    HsAddUrlAsToggleComponent,
  ],
  declarations: [
    HsUrlAddComponent,
    HsUrlProgressComponent,
    HsCommonUrlComponent,
    HsUrlDetailsComponent,
    HsAddUrlAsToggleComponent,
  ],
})
export class HsCommonUrlModule {}
