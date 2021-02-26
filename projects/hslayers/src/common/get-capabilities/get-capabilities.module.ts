import {HsArcgisGetCapabilitiesService} from '../arcgis/get-capabilities.service';
import {HsDimensionService} from '../dimension.service';
import {HsWfsGetCapabilitiesService} from '../wfs/get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../wms/get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../wmts/get-capabilities.service';
import {NgModule} from '@angular/core';

@NgModule({
  declarations: [],
  imports: [],
  providers: [
    HsWfsGetCapabilitiesService,
    HsArcgisGetCapabilitiesService,
    HsWmsGetCapabilitiesService,
    HsWmtsGetCapabilitiesService,
    HsDimensionService,
  ],
  exports: [],
})
export class HsGetCapabilitiesModule {}
