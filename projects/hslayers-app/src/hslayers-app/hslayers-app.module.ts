import {BrowserModule} from '@angular/platform-browser';
import { NgModule, Injector, ComponentFactoryResolver, ApplicationRef} from '@angular/core';
import { createCustomElement } from '@angular/elements';
import {HslayersAppComponent} from './hslayers-app.component';
import {HslayersModule} from '../../../hslayers/src/public-api';
//import {HslayersAppService} from './hslayers-app.service';

const entryComponents = [
  HslayersAppComponent
];
@NgModule({
  declarations: [HslayersAppComponent],
  imports: [BrowserModule, HslayersModule],
  providers: []
})
export class AppModule {
  constructor(private injector: Injector, private resolver: ComponentFactoryResolver) { }

  ngDoBootstrap(appRef: ApplicationRef) {

    const ngElement = createCustomElement(HslayersAppComponent, {injector: this.injector});
    customElements.define('hslayers-app-el', ngElement);

    const rootElements = document.querySelectorAll('hslayers-app-el');
    for (const element of rootElements as any as HTMLElement[]) {
      appRef.bootstrap(HslayersAppComponent, element);
    }
  }
}
