import {inject, Injectable} from '@angular/core';
import {HsConfig} from 'hslayers-ng/config';
import {getPortFromUrl} from './utils';

@Injectable({
  providedIn: 'root',
})
export class HsProxyService {
  hsConfig = inject(HsConfig);

  private laymanUrl: string;

  /**
   * Register Layman endpoints to avoid proxifying them
   * @param endpoints - Layman endpoints to register
   */
  registerLaymanEndpoints(url: string): void {
    this.laymanUrl = url;
  }

  /**
   * Proxify URL if enabled.
   * @param url - URL to proxify
   * @returns Encoded URL with path to hslayers-server proxy or original URL if proxification not needed
   */
  proxify(url: string): string {
    // Early returns for URLs that should never be proxified
    if (this.shouldSkipProxification(url)) {
      return url;
    }

    // Apply proxy if enabled
    if (
      this.hsConfig.useProxy === undefined ||
      this.hsConfig.useProxy === true
    ) {
      const proxyPrefix = this.hsConfig.proxyPrefix || '/proxy/';
      return `${proxyPrefix}${url}`;
    }

    return url;
  }

  /**
   * Checks if URL should skip proxification based on predefined rules
   * @param url - URL to check
   * @returns boolean indicating if proxification should be skipped
   */
  private shouldSkipProxification(url: string): boolean {
    // Don't proxify if it's already proxified
    if (
      this.hsConfig.proxyPrefix &&
      url.startsWith(this.hsConfig.proxyPrefix)
    ) {
      return true;
    }
    // Don't proxify Layman endpoints
    if (this.laymanUrl && url.startsWith(this.laymanUrl)) {
      return true;
    }
    // Don't proxify data URLs
    if (url.startsWith('data:application')) {
      return true;
    }
    // Don't proxify if URL is from the same origin
    if (this.isFromSameOrigin(url)) {
      return true;
    }
    return false;
  }

  /**
   * Checks if URL is from the same origin as the application
   * @param url - URL to check
   * @returns boolean indicating if URL is from the same origin
   */
  private isFromSameOrigin(url: string): boolean {
    console.log('🚀 ~ proxy.service.ts:78 ~ HsProxyService ~ isFromSameOrigin ~ url:', url, window.location.origin);
    const windowUrlPosition = url.indexOf(window.location.origin);
    console.log('🚀 ~ proxy.service.ts:79 ~ isFromSameOrigin ~ windowUrlPosition:', windowUrlPosition);
    // Check if URL is not from the same origin (matching original logic)
    if (
      windowUrlPosition === -1 ||
      windowUrlPosition > 7 ||
      getPortFromUrl(url) !== getPortFromUrl(window.location.origin)
    ) {
      return false;
    }
    return true;
  }
}
