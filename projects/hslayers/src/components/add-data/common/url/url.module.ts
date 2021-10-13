import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {TranslateModule} from '@ngx-translate/core';

import {HsCommonUrlComponent} from './url.component';
import {HsHistoryListModule} from './../../../../common/history-list/history-list.module';
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
    TranslateModule,
    HsHistoryListModule,
    HsUiExtensionsModule,
  ],
  exports: [
    HsUrlAddComponent,
    HsUrlProgressComponent,
    HsCommonUrlComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsUrlDetailsComponent,
  ],
  declarations: [
    HsUrlAddComponent,
    HsUrlProgressComponent,
    HsCommonUrlComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsUrlDetailsComponent,
  ],
})
export class HsCommonUrlModule {}
