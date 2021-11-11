import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsPanelHelpersModule, HsUploadModule} from 'hslayers-ng';
import {HsStatisticsCorrelationsComponent} from './correlations.component';
import {HsStatisticsPanelComponent} from './statistics-panel.component';
import {HsStatisticsUploadPanelComponent} from './upload-panel';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsStatisticsPanelComponent,
    HsStatisticsUploadPanelComponent,
    HsStatisticsCorrelationsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateModule,
    HsUploadModule,
  ],
  exports: [
    HsStatisticsPanelComponent,
    HsStatisticsUploadPanelComponent,
    HsStatisticsCorrelationsComponent,
  ],
  entryComponents: [HsStatisticsPanelComponent],
})
export class HsStatisticsModule {}
