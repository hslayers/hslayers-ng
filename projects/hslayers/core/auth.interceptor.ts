import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import {catchError, map} from 'rxjs/operators';
import {inject} from '@angular/core';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {throwError} from 'rxjs';

export const HsAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(HsCommonLaymanService);

  if (
    authService.layman()?.url &&
    req.url.includes(authService.layman()?.url)
  ) {
    return next(req).pipe(
      map((event) => {
        // Check for HttpResponse (success case)
        if (event instanceof HttpResponse) {
          if (
            event.body?.['authenticated'] === false &&
            authService.isAuthenticated()
          ) {
            // Unauthorized request sent to backend -> logout
            authService.logout$.next();
          }
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          //Unauthorized access, Unsuccessful OAuth2 authentication/HTTP Header authentication
          //https://github.com/LayerManager/layman/blob/master/src/layman/error_list.py
          // --> logout
          authService.logout$.next();
        }
        // Re-throw the error
        return throwError(() => error);
      }),
    );
  }

  return next(req);
};
