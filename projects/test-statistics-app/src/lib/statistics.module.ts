import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsDownloadModule} from 'hslayers-ng';
import {HsPanelHelpersModule, HsUploadModule} from 'hslayers-ng';
import {NgbDropdownModule, NgbNavModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {AbsPipe} from './abs.pipe';
import {HsStatisticsCorrelationsComponent} from './correlations.component';
import {HsStatisticsHistogramComponent} from './histogram-chart-dialog.component';
import {HsStatisticsPanelComponent} from './statistics-panel.component';
import {HsStatisticsPredictionChartDialogComponent} from './prediction-chart-dialog.component';
import {HsStatisticsRegressionDialogComponent} from './regression-dialog.component';
import {HsStatisticsTimeSeriesChartDialogComponent} from './time-series-chart-dialog.component';
import {HsStatisticsToMapDialogComponent} from './to-map-dialog.component';
import {HsStatisticsUploadPanelComponent} from './upload-panel';

@NgModule({
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    declarations: [
        HsStatisticsPanelComponent,
        HsStatisticsUploadPanelComponent,
        HsStatisticsCorrelationsComponent,
        HsStatisticsToMapDialogComponent,
        HsStatisticsTimeSeriesChartDialogComponent,
        HsStatisticsRegressionDialogComponent,
        HsStatisticsHistogramComponent,
        HsStatisticsPredictionChartDialogComponent,
        AbsPipe,
    ],
    imports: [
        CommonModule,
        FormsModule,
        HsPanelHelpersModule,
        TranslateModule,
        HsUploadModule,
        NgbDropdownModule,
        NgbNavModule,
        HsDownloadModule,
    ],
    exports: [
        HsStatisticsPanelComponent,
        HsStatisticsUploadPanelComponent,
        HsStatisticsCorrelationsComponent,
        HsStatisticsToMapDialogComponent,
        HsStatisticsTimeSeriesChartDialogComponent,
        HsStatisticsRegressionDialogComponent,
        HsStatisticsPredictionChartDialogComponent,
        HsStatisticsHistogramComponent,
    ]
})
export class HsStatisticsModule {}
