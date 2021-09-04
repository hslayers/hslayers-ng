import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {ColorSketchModule} from 'ngx-color/sketch';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddFilterButtonComponent} from './filters/add-filter-button.component';
import {HsColorPickerComponent} from './symbolizers/color-picker.component';
import {HsComparisonFilterComponent} from './filters/comparison-filter.component';
import {HsDownloadModule} from '../../common/download/download.module';
import {HsFillSymbolizerComponent} from './symbolizers/fill-symbolizer.component';
import {HsFilterComponent} from './filters/filter.component';
import {HsFiltersComponent} from './filters/filters.component';
import {HsFiltersService} from './filters/filters.service';
import {HsIconSymbolizerComponent} from './symbolizers/icon-symbolizer.component';
import {HsLineSymbolizerComponent} from './symbolizers/line-symbolizer.component';
import {HsMarkSymbolizerComponent} from './symbolizers/mark-symbolizer.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsRuleComponent} from './rule.component';
import {HsScaleDenominatorComponent} from './filters/scale-denominator.component';
import {HsSelectIconDialogComponent} from './symbolizers/select-icon-dialog.component';
import {HsSliderComponent} from './symbolizers/slider.component';
import {HsStylerComponent} from './styler.component';
import {HsStylerPartBaseComponent} from './style-part-base.component';
import {HsStylerService} from './styler.service';
import {HsSymbolizerComponent} from './symbolizers/symbolizer.component';
import {HsTextSymbolizerComponent} from './symbolizers/text-symbolizer.component';
import {HsUploadModule} from '../../common/upload/upload.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [
    HsStylerComponent,
    HsRuleComponent,
    HsSymbolizerComponent,
    HsFillSymbolizerComponent,
    HsMarkSymbolizerComponent,
    HsIconSymbolizerComponent,
    HsTextSymbolizerComponent,
    HsLineSymbolizerComponent,
    HsColorPickerComponent,
    HsSliderComponent,
    HsFiltersComponent,
    HsFilterComponent,
    HsComparisonFilterComponent,
    HsAddFilterButtonComponent,
    HsScaleDenominatorComponent,
    HsSelectIconDialogComponent,
    HsStylerPartBaseComponent,
  ],
  imports: [
    CommonModule,
    ColorSketchModule,
    HsPanelHelpersModule,
    FormsModule,
    NgbModule,
    TranslateModule,
    HsUploadModule,
    HsDownloadModule,
  ],
  exports: [
    HsStylerComponent,
    HsRuleComponent,
    HsSymbolizerComponent,
    HsFillSymbolizerComponent,
    HsMarkSymbolizerComponent,
    HsIconSymbolizerComponent,
    HsTextSymbolizerComponent,
    HsLineSymbolizerComponent,
    HsColorPickerComponent,
    HsSliderComponent,
    HsFiltersComponent,
    HsFilterComponent,
    HsComparisonFilterComponent,
    HsAddFilterButtonComponent,
    HsScaleDenominatorComponent,
    HsSelectIconDialogComponent,
  ],
  entryComponents: [
    HsStylerComponent,
    HsRuleComponent,
    HsSymbolizerComponent,
    HsFillSymbolizerComponent,
    HsMarkSymbolizerComponent,
    HsIconSymbolizerComponent,
    HsTextSymbolizerComponent,
    HsLineSymbolizerComponent,
    HsColorPickerComponent,
    HsSliderComponent,
    HsFiltersComponent,
    HsFilterComponent,
    HsComparisonFilterComponent,
    HsAddFilterButtonComponent,
    HsScaleDenominatorComponent,
    HsSelectIconDialogComponent,
  ],
})
export class HsStylerModule {}
