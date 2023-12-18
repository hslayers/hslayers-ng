import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsCatalogueMetadataComponent} from './catalogue-metadata.component';
import {HsUiExtensionsModule} from '../../../../common/widgets/ui-extensions.module';
import {TranslateCustomPipe} from '../../../language/translate-custom.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsUiExtensionsModule,
  ],
  exports: [HsCatalogueMetadataComponent],
  declarations: [HsCatalogueMetadataComponent],
  providers: [],
})
export class HsCatalogueMetadataModule {}
