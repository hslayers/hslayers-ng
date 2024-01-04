import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsAddToMapButtonComponent} from 'hslayers-ng/common/add-to-map';
import {HsCommonUrlComponent} from './url.component';
import {HsHistoryListModule} from 'hslayers-ng/common/history-list';
import {HsLayerTableComponent} from './layer-table/layer-table.component';
import {HsNestedLayersTableComponent} from './nested-layers-table/nested-layers-table.component';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {HsUrlAddComponent} from './add/add.component';
import {HsUrlDetailsComponent} from './details/details.component';
import {HsUrlProgressComponent} from './progress/progress.component';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';
import {WmsLayerHighlightDirective} from './wms-layer-highlight.directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsHistoryListModule,
    HsUiExtensionsModule,
    HsAddToMapButtonComponent,
  ],
  exports: [
    HsUrlAddComponent,
    HsUrlProgressComponent,
    HsCommonUrlComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsUrlDetailsComponent,
    HsLayerTableComponent,
  ],
  declarations: [
    HsUrlAddComponent,
    HsUrlProgressComponent,
    HsCommonUrlComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsUrlDetailsComponent,
    HsLayerTableComponent,
  ],
})
export class HsCommonUrlModule {}
