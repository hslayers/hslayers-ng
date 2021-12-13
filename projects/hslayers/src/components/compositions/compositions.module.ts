import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateModule} from '@ngx-translate/core';

import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsLayerParserModule} from './layer-parser/layer-parser.module';
import {HsCompositionsListItemComponent} from './compositions-list-item.component';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsCompositionsWarningDialogComponent} from './dialogs/warning-dialog.component';
import {HsLaymanModule} from '../../common/layman/layman.module';
import {HsPagerModule} from '../../common/pager/pager.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsCompositionsComponent,
    HsCompositionsOverwriteDialogComponent,
    HsCompositionsDeleteDialogComponent,
    HsCompositionsShareDialogComponent,
    HsCompositionsInfoDialogComponent,
    HsCompositionsWarningDialogComponent,
    HsCompositionsListItemComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateModule,
    HsCompositionsLayerParserModule,
    NgbDropdownModule,
    HsLaymanModule,
    HsPagerModule,
  ],
  exports: [HsCompositionsComponent],
})
export class HsCompositionsModule {}
