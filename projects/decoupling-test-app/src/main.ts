import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {provideZoneChangeDetection} from '@angular/core';

import {AppModule} from './hslayers-app/hslayers-app.module';

setTimeout(() => {
  const bootstrap = () =>
    platformBrowserDynamic().bootstrapModule(AppModule, {
      applicationProviders: [provideZoneChangeDetection()],
    });
  bootstrap().catch((err) => console.log(err));
}, 0);
