import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsDownloadModule, HsLanguageModule} from 'hslayers-ng';
import {HsPanelHelpersModule, HsUploadModule} from 'hslayers-ng';
import {NgbDropdownModule, NgbNavModule} from '@ng-bootstrap/ng-bootstrap';

import {AbsPipe} from './abs.pipe';
import {HsStatisticsCorrelationsComponent} from './correlations.component';
import {HsStatisticsHistogramComponent} from './histogram-chart-dialog.component';
import {HsStatisticsPanelComponent} from './statistics-panel.component';
import {HsStatisticsPredictionChartDialogComponent} from './prediction-chart-dialog.component';
import {HsStatisticsRegressionDialogComponent} from './regression-dialog.component';
import {HsStatisticsTimeSeriesChartComponent} from './time-series-chart';
import {HsStatisticsTimeSeriesChartDialogComponent} from './time-series-chart-dialog.component';
import {HsStatisticsToMapDialogComponent} from './to-map-dialog.component';
import {HsStatisticsUploadPanelComponent} from './upload-panel';
import { HsSketchFunctionComponent } from './sketch-function.component';

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
    HsStatisticsTimeSeriesChartComponent,
    HsSketchFunctionComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    HsLanguageModule,
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
    HsStatisticsTimeSeriesChartComponent,
    HsSketchFunctionComponent,
  ],
})
export class HsStatisticsModule {}
