import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {
  NgbAccordionModule,
  NgbDropdownModule,
} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {HsClipboardTextComponent} from 'hslayers-ng/common/clipboard-text';
import {HsCommonUrlModule} from 'hslayers-ng/components/add-data';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsListItemComponent} from './compositions-list-item.component';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsLaymanCurrentUserComponent} from 'hslayers-ng/common/layman';
import {HsPagerModule} from 'hslayers-ng/common/pager';
import {
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsCompositionsComponent,
    HsCompositionsOverwriteDialogComponent,
    HsCompositionsDeleteDialogComponent,
    HsCompositionsShareDialogComponent,
    HsCompositionsListItemComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslatePipe,
    NgbDropdownModule,
    NgbAccordionModule,
    HsLaymanCurrentUserComponent,
    HsPagerModule,
    HsCommonUrlModule,
    HsPanelHeaderComponent,
    HsClipboardTextComponent,
  ],
  exports: [HsCompositionsComponent],
})
export class HsCompositionsModule {}
