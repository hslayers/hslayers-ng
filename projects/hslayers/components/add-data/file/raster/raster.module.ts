import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {NgbAccordionModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsFileRasterComponent} from './raster.component';
import {HsUploadModule} from 'hslayers-ng/common/upload';
import {RasterTimeseriesComponent} from './raster-timeseries/raster-timeseries.component';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    TranslateCustomPipe,
    HsUploadModule,
    NgbAccordionModule,
  ],
  exports: [HsFileRasterComponent],
  declarations: [HsFileRasterComponent, RasterTimeseriesComponent],
  providers: [],
})
export class HsFileRasterModule {}
