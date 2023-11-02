import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsAddToMapButton} from '../../../../common/add-to-map/add-to-map.component';
import {HsCommonUrlComponent} from './url.component';
import {HsHistoryListModule} from './../../../../common/history-list/history-list.module';
import {HsLanguageModule} from '../../../language/language.module';
import {HsLayerTableComponent} from './layer-table/layer-table.component';
import {HsNestedLayersTableComponent} from './nested-layers-table/nested-layers-table.component';
import {HsUiExtensionsModule} from './../../../../common/widgets/ui-extensions.module';
import {HsUrlAddComponent} from './add/add.component';
import {HsUrlDetailsComponent} from './details/details.component';
import {HsUrlProgressComponent} from './progress/progress.component';
import {WmsLayerHighlightDirective} from './wms-layer-highlight.directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    HsLanguageModule,
    HsHistoryListModule,
    HsUiExtensionsModule,
    HsAddToMapButton,
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
