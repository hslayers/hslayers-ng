import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {FilterPipe} from './filter.pipe';
import {HsUiExtensionsRecursiveDdComponent} from './recursive-dd.component';
import {TrackByPropertyPipe} from './trackByProperty.pipe';

@NgModule({
  declarations: [
    HsUiExtensionsRecursiveDdComponent,
    FilterPipe,
    TrackByPropertyPipe,
  ],
  imports: [CommonModule],
  providers: [],
  exports: [
    HsUiExtensionsRecursiveDdComponent,
    FilterPipe,
    TrackByPropertyPipe,
  ],
})
export class HsUiExtensionsModule {}
