/**
 * @namespace hs.legend
 * @memberOf hs
 */
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsLegendComponent} from './legend.component';
import {HsLegendLayerComponent} from './legend-layer.component';
import {HsLegendLayerStaticComponent} from './legend-layer-static.component';
import {HsLegendLayerVectorComponent} from './legend-layer-vector.component';
import {HsLegendService} from './legend.service';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsLegendComponent,
    HsLegendLayerComponent,
    HsLegendLayerVectorComponent,
    HsLegendLayerStaticComponent,
  ],
  imports: [CommonModule, HsPanelHelpersModule, TranslateModule],
  exports: [HsLegendComponent, HsLegendLayerComponent],
  providers: [HsLegendService, TranslateStore],
  entryComponents: [HsLegendComponent, HsLegendLayerComponent],
})
export class HsLegendModule {}
