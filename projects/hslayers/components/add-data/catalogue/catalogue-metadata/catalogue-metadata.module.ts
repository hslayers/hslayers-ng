import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsCatalogueMetadataComponent} from './catalogue-metadata.component';
import {HsUiExtensionsModule} from 'hslayers-ng/common/widgets';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

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
