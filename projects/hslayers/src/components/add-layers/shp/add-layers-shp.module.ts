import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddLayersCommonModule} from '../common/add-layers-common.module';
import {HsAddLayersShpComponent} from './add-layers-shp.component';
import {HsAddLayersShpService} from './add-layers-shp.service';
import {HsUiExtensionsModule} from '../../../common/widgets/ui-extensions.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsUiExtensionsModule,
    HsAddLayersCommonModule,
  ],
  exports: [HsAddLayersShpComponent],
  declarations: [HsAddLayersShpComponent],
  providers: [HsAddLayersShpService],
})
export class HsAddLayersShpModule {}
