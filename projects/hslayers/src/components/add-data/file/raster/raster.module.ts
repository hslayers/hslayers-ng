import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';
import {NgbAccordionModule} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsFileRasterComponent} from './raster.component';
import {HsLanguageModule} from '../../../language/language.module';
import {HsUploadModule} from '../../../../common/upload/upload.module';
import {RasterTimeseriesComponent} from './raster-timeseries/raster-timeseries.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLanguageModule,
    HsUploadModule,
    NgbAccordionModule,
  ],
  exports: [HsFileRasterComponent],
  declarations: [HsFileRasterComponent, RasterTimeseriesComponent],
  providers: [],
})
export class HsFileRasterModule {}
