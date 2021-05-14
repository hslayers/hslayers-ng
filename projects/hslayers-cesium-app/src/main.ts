import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

setTimeout(() => {
  const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);
  bootstrap().catch((err) => console.log(err));
}, 0);
