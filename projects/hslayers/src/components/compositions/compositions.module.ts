import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {NgbAccordionModule} from '@ng-bootstrap/ng-bootstrap';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

import {CswLayersDialogComponent} from './dialogs/csw-layers-dialog/csw-layers-dialog.component';
import {HsCommonUrlModule} from '../add-data/common/url/url.module';
import {HsCompositionsComponent} from './compositions.component';
import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsLayerParserModule} from './layer-parser/layer-parser.module';
import {HsCompositionsListItemComponent} from './compositions-list-item.component';
import {HsCompositionsOverwriteDialogComponent} from './dialogs/overwrite-dialog.component';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsCompositionsWarningDialogComponent} from './dialogs/warning-dialog.component';
import {TranslateCustomPipe} from '../language/translate-custom.pipe';
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
    CswLayersDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    TranslateCustomPipe,
    HsCompositionsLayerParserModule,
    NgbDropdownModule,
    NgbAccordionModule,
    HsLaymanModule,
    HsPagerModule,
    HsCommonUrlModule,
  ],
  exports: [HsCompositionsComponent],
})
export class HsCompositionsModule {}
