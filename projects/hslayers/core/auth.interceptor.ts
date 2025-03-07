import {HttpInterceptorFn, HttpResponse} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {inject} from '@angular/core';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';

export const HsAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(HsCommonLaymanService);

  if (
    authService.layman()?.url &&
    req.url.includes(authService.layman()?.url)
  ) {
    return next(req).pipe(
      map((event: HttpResponse<unknown>) => {
        if (
          event.body?.['authenticated'] === false &&
          authService.isAuthenticated()
        ) {
          //Unauthorized request sent to backend -> logout
          authService.logout$.next();
        }
        return event;
      }),
    );
  }

  return next(req);
};
