import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './hslayers-app/hslayers-app.module';

setTimeout(() => {
  const bootstrap = () => platformBrowserDynamic().bootstrapModule(AppModule);
  bootstrap().catch((err) => console.log(err));
}, 0);
