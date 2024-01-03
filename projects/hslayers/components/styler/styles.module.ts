import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';

import {ColorSketchModule} from 'ngx-color/sketch';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddColormapComponent} from './add-colormap.component';
import {HsAddFilterButtonComponent} from './filters/add-filter-button.component';
import {HsColorPickerComponent} from './symbolizers/color-picker/color-picker.component';
import {HsColormapPickerModule} from 'hslayers-ng/common/color-map-picker';
import {HsComparisonFilterComponent} from './filters/comparison-filter.component';
import {HsDownloadModule} from 'hslayers-ng/common/download';
import {HsFillSymbolizerComponent} from './symbolizers/fill-symbolizer/fill-symbolizer.component';
import {HsFilterComponent} from './filters/filter.component';
import {HsFiltersComponent} from './filters/filters.component';
import {HsIconSymbolizerComponent} from './symbolizers/icon-symbolizer/icon-symbolizer.component';
import {HsLineSymbolizerComponent} from './symbolizers/line-symbolizer/line-symbolizer.component';
import {HsMarkSymbolizerComponent} from './symbolizers/mark-symbolizer/mark-symbolizer.component';
import {HsPanelHeaderComponent} from 'hslayers-ng/components/layout';
import {HsPanelHelpersModule} from 'hslayers-ng/components/layout';
import {HsRuleComponent} from './rule/rule.component';
import {HsRuleListItemComponent} from './rule/rule-list-item/rule-list-item.component';
import {HsScaleDenominatorComponent} from './filters/scale-denominator.component';
import {HsSelectIconDialogComponent} from './symbolizers/select-icon-dialog/select-icon-dialog.component';
import {HsSliderComponent} from './symbolizers/slider/slider.component';
import {HsStylerComponent} from './styler.component';
import {HsStylerEditDialogComponent} from './edit-dialog/edit-dialog.component';
import {HsStylerPartBaseComponent} from './style-part-base.component';
import {HsSymbolizerComponent} from './symbolizers/symbolizer.component';
import {HsSymbolizerListItemComponent} from './symbolizers/symbolizer-list-item/symbolizer-list-item.component';
import {HsTextSymbolizerComponent} from './symbolizers/text-symbolizer/text-symbolizer.component';
import {HsUploadModule} from 'hslayers-ng/common/upload';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
    HsRuleListItemComponent,
    HsSymbolizerListItemComponent,
    HsAddColormapComponent,
    HsStylerEditDialogComponent,
  ],
  imports: [
    CommonModule,
    ColorSketchModule,
    HsPanelHelpersModule,
    FormsModule,
    NgbDropdownModule,
    TranslateCustomPipe,
    HsUploadModule,
    HsDownloadModule,
    DragDropModule,
    HsColormapPickerModule,
    HsPanelHeaderComponent,
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
    HsSymbolizerListItemComponent,
    HsColorPickerComponent,
    HsSliderComponent,
    HsFiltersComponent,
    HsFilterComponent,
    HsComparisonFilterComponent,
    HsAddFilterButtonComponent,
    HsScaleDenominatorComponent,
    HsSelectIconDialogComponent,
    HsRuleListItemComponent,
    HsAddColormapComponent,
  ],
})
export class HsStylerModule {}
