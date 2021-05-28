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

import {HsColorPickerComponent} from './symbolizers/color-picker.component';
import {HsFillSymbolizerComponent} from './symbolizers/fill-symbolizer.component';
import {HsFilterComponent} from './filter.component';
import {HsFiltersComponent} from './filters.component';
import {HsFiltersService} from './filters.service';
import {HsIconSymbolizerComponent} from './symbolizers/icon-symbolizer.component';
import {HsLineSymbolizerComponent} from './symbolizers/line-symbolizer.component';
import {HsMarkSymbolizerComponent} from './symbolizers/mark-symbolizer.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsRuleComponent} from './rule.component';
import {HsSliderComponent} from './symbolizers/slider.component';
import {HsStylerComponent} from './styler.component';
import {HsStylerService} from './styler.service';
import {HsSymbolizerComponent} from './symbolizers/symbolizer.component';
import {HsTextSymbolizerComponent} from './symbolizers/text-symbolizer.component';

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
  ],
  imports: [
    CommonModule,
    ColorSketchModule,
    HsPanelHelpersModule,
    FormsModule,
    NgbModule,
    TranslateModule,
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
  ],
  providers: [HsStylerService, HsFiltersService],
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
  ],
})
export class HsStylerModule {}
