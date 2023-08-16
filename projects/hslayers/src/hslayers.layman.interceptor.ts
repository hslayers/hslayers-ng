import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, map} from 'rxjs';

import {HsCommonLaymanService} from './common/layman/layman.service';

@Injectable()
export class HslayersLaymanInterceptor implements HttpInterceptor {
  constructor(private commonLayman: HsCommonLaymanService) {}

  /**
   * Intercept every request to backend
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (this.commonLayman.layman?.type.includes('wagtail')) {
      return next.handle(request).pipe(
        map((evt: HttpEvent<any>) => {
          if (
            evt instanceof HttpResponse &&
            evt.url.includes(this.commonLayman.layman.url)
          ) {
            const strBody = JSON.stringify(evt.body);
            const layman = this.commonLayman.layman.url; //eg. https://watlas.lesprojekt.cz/layman-proxy
            const baseUrl = layman.split('layman')[0]; //Take only base

            const pattern = new RegExp(`${baseUrl}(geoserver|rest)/`, 'g');
            const replacement = `${layman}/$1/`;

            const response = new HttpResponse({
              ...evt,
              body: JSON.parse(strBody.replace(pattern, replacement)),
            });
            return response;
          }
          return evt;
        }),
      );
    }

    return next.handle(request);
  }
}
