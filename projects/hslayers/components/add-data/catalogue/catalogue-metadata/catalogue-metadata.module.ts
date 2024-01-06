import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsCatalogueMetadataComponent} from './catalogue-metadata.component';
import {HsUiExtensionsRecursiveDdComponent} from 'hslayers-ng/common/widgets';
import {TranslateCustomPipe} from 'hslayers-ng/shared/language';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateCustomPipe,
    HsUiExtensionsRecursiveDdComponent,
  ],
  exports: [HsCatalogueMetadataComponent],
  declarations: [HsCatalogueMetadataComponent],
  providers: [],
})
export class HsCatalogueMetadataModule {}
