import {HttpInterceptorFn} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {inject} from '@angular/core';
import {throwError} from 'rxjs';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(HsCommonLaymanService);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && err?.authenticated === false) {
        //Unauthorized request sent to backend -> logout
        authService.logout$.next();
      }
      // Re-throw the error so it can be handled elsewhere if needed
      return throwError(() => err);
    }),
  );
};
