import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {EpsgPipe} from './epsg.pipe';
import {FilterPipe} from './filter.pipe';
import {HsUiExtensionsRecursiveDdComponent} from './recursive-dd.component';
import {TrackByPropertyPipe} from './trackByProperty.pipe';

@NgModule({
  declarations: [
    HsUiExtensionsRecursiveDdComponent,
    FilterPipe,
    TrackByPropertyPipe,
    EpsgPipe,
  ],
  imports: [CommonModule],
  providers: [],
  exports: [
    HsUiExtensionsRecursiveDdComponent,
    FilterPipe,
    TrackByPropertyPipe,
    EpsgPipe,
  ],
})
export class HsUiExtensionsModule {}
