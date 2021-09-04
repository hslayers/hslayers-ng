/* eslint-disable no-console */
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class HsLogService {
  warn(...attrs): void {
    console.warn(attrs);
  }
  log(...attrs): void {
    console.log(attrs);
  }
  error(...attrs): void {
    console.error(attrs);
  }
  info(...attrs): void {
    console.info(attrs);
  }
}
