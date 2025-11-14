import {Injectable} from '@angular/core';

import {CapabilitiesResponseWrapper} from 'hslayers-ng/types';

export interface CapabilityCacheList {
  [key: string]: CapabilitiesResponseWrapper;
}

@Injectable({providedIn: 'platform'})
export class HsCapabilityCacheService {
  cache: CapabilityCacheList = {};
  private pendingRequests = new Map<
    string,
    Promise<CapabilitiesResponseWrapper>
  >();
  constructor() {}
  set(url: string, wrap: CapabilitiesResponseWrapper): void {
    if (!wrap?.error) {
      this.cache[url] = wrap;
    }
  }

  get(url: string): CapabilitiesResponseWrapper {
    return this.cache[url];
  }

  /**
   * Get cached response or fetch with deduplication
   * Prevents duplicate concurrent requests for the same URL
   *
   * @param url - URL to fetch
   * @param fetcher - Function that performs the actual HTTP request
   * @param owrCache - Overwrites cache for the requested url
   * @returns Promise with the capabilities response
   */
  async getOrFetch(
    url: string,
    fetcher: () => Promise<CapabilitiesResponseWrapper>,
    owrCache?: boolean,
  ): Promise<CapabilitiesResponseWrapper> {
    // Check cache first (unless owrCache is true)
    if (!owrCache && this.cache[url]) {
      return this.cache[url];
    }

    // Check if there's a pending request
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url);
    }

    // Create new request
    const requestPromise = fetcher()
      .then((response) => {
        if (!response?.error) {
          this.set(url, response);
        }
        this.pendingRequests.delete(url);
        return response;
      })
      .catch((error) => {
        this.pendingRequests.delete(url);
        throw error;
      });

    this.pendingRequests.set(url, requestPromise);

    return requestPromise;
  }
}
