import {Injectable} from '@angular/core';

import {CapabilitiesResponseWrapper} from 'hslayers-ng/common/types';

export interface CapabilityCacheList {
  [key: string]: CapabilitiesResponseWrapper;
}

@Injectable({providedIn: 'platform'})
export class HsCapabilityCacheService {
  cache: CapabilityCacheList = {};
  constructor() {}
  set(url: string, wrap: CapabilitiesResponseWrapper): void {
    if (!wrap?.error && wrap.response?.layers?.length > 0) {
      this.cache[url] = wrap;
    }
  }

  get(url: string): CapabilitiesResponseWrapper {
    return this.cache[url];
  }
}
