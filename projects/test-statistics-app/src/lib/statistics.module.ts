import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsPanelHelpersModule, HsUploadModule} from 'hslayers-ng';
import {HsStatisticsCorrelationsComponent} from './correlations.component';
import {HsStatisticsPanelComponent} from './statistics-panel.component';
import {HsStatisticsToMapDialogComponent} from './to-map-dialog.component';
import {HsStatisticsUploadPanelComponent} from './upload-panel';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsStatisticsPanelComponent,
    HsStatisticsUploadPanelComponent,
    HsStatisticsCorrelationsComponent,
    HsStatisticsToMapDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateModule,
    HsUploadModule,
    NgbDropdownModule,
  ],
  exports: [
    HsStatisticsPanelComponent,
    HsStatisticsUploadPanelComponent,
    HsStatisticsCorrelationsComponent,
    HsStatisticsToMapDialogComponent,
  ],
  entryComponents: [HsStatisticsPanelComponent],
})
export class HsStatisticsModule {}
