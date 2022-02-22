import {
  ApplicationRef,
  DoBootstrap,
  NgModule,
  Type,
} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {HslayersAppComponent} from './hslayers-app.component';
import {HslayersModule} from '../../../hslayers/src/public-api';

@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, HslayersModule],
  providers: [],
  bootstrap: [HslayersAppComponent],
})
export class AppModule implements DoBootstrap {
  components = [
    {type: HslayersAppComponent, selector: 'hslayers#app-1'},
    {type: HslayersAppComponent, selector: 'hslayers#app-2'},
  ];
  HslayersAppComponent;
  constructor() {}

  ngDoBootstrap(appRef: ApplicationRef) {
    this.components.forEach(
      (componentDef: {type?: Type<any>; selector: string}) => {
        appRef.bootstrap(componentDef.type, componentDef.selector);
      }
    );
  }
}
