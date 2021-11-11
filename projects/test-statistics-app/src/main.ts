import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';

setTimeout(() => {
  const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);
  bootstrap().catch((err) => console.log(err));
}, 0);
