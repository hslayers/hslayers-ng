import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {HsDatasourcesComponent} from './datasource-selector.component';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterService} from './micka/micka-filters.service';
import {HsPanelHelpersModule} from '../layout/panel-helpers.module';
import {HsSelectTypeToAddLayerDialogComponent} from './select-type-to-add-layer-dialog.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsDatasourcesComponent],
  imports: [BrowserModule, CommonModule, FormsModule, HsPanelHelpersModule],
  exports: [HsDatasourcesComponent, HsSelectTypeToAddLayerDialogComponent],
  providers: [
    HsDatasourcesService,
    HsDatasourcesMapService,
    HsLaymanBrowserService,
    HsMickaBrowserService,
    HsMickaFilterService,
  ],
  entryComponents: [HsDatasourcesComponent],
})
export class HsDatasourcesModule {}
