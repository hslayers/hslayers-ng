import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

/* import {
  HsGeolocationModule,
  HsInfoModule,
  HsSearchModule,
} from 'hslayers-ng/public-api'; */
//import {HsMeasureModule} from 'hslayers-ng/components/measure/public-api';
//import {HsDrawModule} from 'hslayers-ng/components/draw/public-api';
import {FormsModule} from '@angular/forms';
import {HsLayoutModule} from 'hslayers-ng/components/layout';
import {HslayersAppComponent} from './hslayers-app.component';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [HttpClientModule, BrowserModule, FormsModule, HsLayoutModule],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule {}

/***
 *
 * V appke import toho čo je potrbea z knižnice  - nejaky wrapper aby to bolo čo najjednoduchšie??
 * To čo je hslayers-component by teda malo byt až v appke nie v knižnici - vynimka simple apps?
 * Nejaka init podoba kde bude na rýyhclo základ. tj. hslayers componenta ale oklieštená.
 * Mapa + Layermanager?
 *
 */
