import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsCompositionsLaymanService} from './compositions-layman.service';
import {HsCompositionsMickaService} from './compositions-micka.service';
import {HsCompositionsStatusManagerMickaJointService} from './status-manager-micka-joint.service';
import {HsCompositionsStatusManagerService} from './compositions-status-manager.service';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [],
  imports: [CommonModule, FormsModule, TranslateModule],
  exports: [],
  providers: [
    HsCompositionsLaymanService,
    HsCompositionsMickaService,
    HsCompositionsStatusManagerService,
    HsCompositionsStatusManagerMickaJointService,
  ],
  entryComponents: [],
})
export class HsCompositionsEndpointsModule {}
