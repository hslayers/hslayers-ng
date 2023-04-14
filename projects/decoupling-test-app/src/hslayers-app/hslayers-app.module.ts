import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {HsCoreModule} from '../../../hslayers/src/components/core/core.module';
/* import {
  HsGeolocationModule,
  HsInfoModule,
  HsSearchModule,
} from 'hslayers-ng/public-api'; */
import {HsLayoutModule} from '../../../hslayers/src/components/layout/layout.module';
//import {HsMeasureModule} from 'hslayers-ng/components/measure/public-api';
//import {HsDrawModule} from 'hslayers-ng/components/draw/public-api';
import {FormsModule} from '@angular/forms';
import {HsAddDataModule} from '../../../hslayers/src/components/add-data/add-data.module';
import {HsCompositionsModule} from '../../../hslayers/src/components/compositions/compositions.module';
import {HsDrawModule} from '../../../hslayers/src/components/draw/draw.module';
import {HsLanguageModule} from '../../../hslayers/src/components/language/language.module';
import {HsLayerManagerModule} from '../../../hslayers/src/components/layermanager/layermanager.module';
import {HsQueryModule} from '../../../hslayers/src/components/query/query.module';
import {HslayersAppComponent} from './hslayers-app.component';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [
    BrowserModule,
    FormsModule,
    HsLanguageModule,
    HsCoreModule,
    HsLayoutModule,
    HsDrawModule,
    HsLayerManagerModule,
    HsAddDataModule,
    HsCompositionsModule,
    //HsMeasureModule,
    //HsSearchModule,
    //HsInfoModule,
    //HsGeolocationModule,
    HsQueryModule,
  ],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}
