import { Injectable } from '@angular/core';
@Injectable({
    providedIn: 'any',
  })
  export class HsLogService {
    warn(...attrs) {
        console.warn(attrs);
    }
    log (...attrs){
        console.log(attrs);
    }
  }