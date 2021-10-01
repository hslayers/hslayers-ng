import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonComponentsModule} from './common-components/common-components.module';
import {HsCommonUrlAddComponent} from './common-url/common-url-add/common-url-add.component';
import {HsCommonUrlComponent} from './common-url/common-url.component';
import {HsCommonUrlDetailsComponent} from './common-url/common-url-details/common-url-details.component';
import {HsCommonUrlProgressComponent} from './common-url/common-url-progress/common-url-progress.component';
import {HsHistoryListModule} from './../../../common/history-list/history-list.module';
import {HsNestedLayersTableComponent} from './common-url/nested-layers-table/nested-layers-table.component';
import {HsNewLayerFormComponent} from './common-components/new-layer-form/new-layer-form.component';
import {HsUiExtensionsModule} from './../../../common/widgets/ui-extensions.module';
import {WmsLayerHighlightDirective} from './common-url/add-data-wms-layer-highlight.directive';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsAddDataCommonComponentsModule,
    HsHistoryListModule,
    HsUiExtensionsModule,
  ],
  exports: [
    HsCommonUrlAddComponent,
    HsCommonUrlProgressComponent,
    HsCommonUrlComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsCommonUrlDetailsComponent,
    HsNewLayerFormComponent,
  ],
  declarations: [
    HsCommonUrlAddComponent,
    HsCommonUrlProgressComponent,
    HsCommonUrlComponent,
    HsNestedLayersTableComponent,
    WmsLayerHighlightDirective,
    HsCommonUrlDetailsComponent,
  ],
})
export class HsAddDataCommonModule {}
