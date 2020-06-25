import { Injectable, Inject } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
    providedIn: 'any',
  })
  export class HsEventBusService {
    sizeChanges: Subject<any> = new Subject();
    mapResets: Subject<any> = new Subject();

    constructor(){

    }
}