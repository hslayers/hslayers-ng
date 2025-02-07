import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {
  NgbAccordionModule,
  NgbDropdownModule,
} from '@ng-bootstrap/ng-bootstrap';

import {HsClipboardTextComponent} from 'hslayers-ng/common/clipboard-text';
import {HsCommonUrlModule} from 'hslayers-ng/components/add-data';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsListItemComponent} from './compositions-list-item.component';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsLaymanModule} from 'hslayers-ng/common/layman';
import {HsPagerModule} from 'hslayers-ng/common/pager';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsCompositionsComponent,
    HsCompositionsOverwriteDialogComponent,
    HsCompositionsDeleteDialogComponent,
    HsCompositionsShareDialogComponent,
    HsCompositionsInfoDialogComponent,
    HsCompositionsListItemComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateCustomPipe,
    NgbDropdownModule,
    NgbAccordionModule,
    HsLaymanModule,
    HsPagerModule,
    HsCommonUrlModule,
    HsPanelHeaderComponent,
    HsClipboardTextComponent,
  ],
  exports: [HsCompositionsComponent],
})
export class HsCompositionsModule {}
