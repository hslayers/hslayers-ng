import { Injectable } from '@angular/core';
@Injectable({
    providedIn: 'root',
  })
  export class HsLogService {
    warn(...attrs) {
        console.warn(attrs);
    }
    log (...attrs){
        console.log(attrs);
    }
    error (...attrs){
        console.error(attrs);
    }
    info (...attrs){
        console.info(attrs);
    }
  }