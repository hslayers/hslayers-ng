import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsAddLayersTargetPositionComponent} from './add-layers-target-position.component';
import {HsAddLayersUrlComponent} from './add-layers-url.component';
import {HsHistoryListModule} from '../../../common/history-list/history-list.module';
import {NgModule} from '@angular/core';
import {TranslateModule} from '@ngx-translate/core';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, TranslateModule, HsHistoryListModule],
  exports: [HsAddLayersUrlComponent, HsAddLayersTargetPositionComponent],
  declarations: [HsAddLayersUrlComponent, HsAddLayersTargetPositionComponent],
  providers: [],
})
export class HsAddLayersCommonModule {}
