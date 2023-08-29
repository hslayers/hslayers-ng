import {Injectable} from '@angular/core';

import {CapabilitiesResponseWrapper} from './capabilities-response-wrapper';

export interface CapabilityCacheList {
  [key: string]: CapabilitiesResponseWrapper;
}

@Injectable({providedIn: 'root'})
export class HsCapabilityCacheService {
  cache: CapabilityCacheList = {};
  constructor() {}
  set(url: string, wrap: CapabilitiesResponseWrapper): void {
    if (!wrap?.error) {
      this.cache[url] = wrap;
    }
  }

  get(url: string): CapabilitiesResponseWrapper {
    return this.cache[url];
  }
}
