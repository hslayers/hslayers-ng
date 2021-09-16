import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {TranslateModule} from '@ngx-translate/core';

import {HsCatalogueMetadataComponent} from './catalogue-metadata.component';
import {HsUiExtensionsModule} from '../../../../common/widgets/ui-extensions.module';

@NgModule({
  imports: [CommonModule, FormsModule, TranslateModule, HsUiExtensionsModule],
  exports: [HsCatalogueMetadataComponent],
  declarations: [HsCatalogueMetadataComponent],
  providers: [],
})
export class HsCatalogueMetadataModule {}
