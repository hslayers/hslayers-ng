import {signal} from '@angular/core';
import {of} from 'rxjs';
import {HsEndpoint} from 'hslayers-ng/types';

// Default mock endpoint data
export const mockEndpoint = {
  type: 'layman-wagtail',
  title: 'layman',
  url: 'http://madeupurl',
  user: 'current-user',
  authenticated: true,
};

/**
 * Creates a mock of the HsCommonLaymanService
 * @param customEndpoint Optional custom endpoint to override the default
 * @param customMethods Optional custom method implementations
 * @returns A mock of the HsCommonLaymanService
 */
export function createMockLaymanService(
  customEndpoint?: Partial<HsEndpoint>,
  customMethods?: {
    getStyleFromUrl?: (styleUrl: string) => Promise<string>;
    [key: string]: any;
  },
) {
  const endpoint = {...mockEndpoint, ...customEndpoint};

  const authState = signal({
    user: endpoint.user,
    authenticated: endpoint.authenticated,
  });

  const authState$ = of(authState());

  return {
    // Observable of the endpoint
    layman$: of(endpoint),

    // Signal of the endpoint
    layman: signal(endpoint),

    // Auth state signal
    authState,
    authState$,

    // Convenience signals
    isAuthenticated: signal(!!endpoint.authenticated),
    user: signal(endpoint.user),

    // Mock methods
    getCurrentUser: jasmine.createSpy('getCurrentUser').and.returnValue(
      of({
        username: endpoint.user,
        authenticated: endpoint.authenticated,
      }),
    ),

    pollForUser: jasmine.createSpy('pollForUser').and.returnValue(
      of({
        username: endpoint.user,
        authenticated: endpoint.authenticated,
      }),
    ),

    logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve()),

    // Action subjects (can be used to trigger auth state changes)
    login$: {
      next: jasmine.createSpy('login$.next'),
    },

    logout$: {
      next: jasmine.createSpy('logout$.next'),
    },

    // Default implementation of getStyleFromUrl (returns empty string)
    async getStyleFromUrl(styleUrl: string): Promise<string> {
      return '';
    },

    // Helper method to update the endpoint in tests
    updateEndpoint(newEndpoint: Partial<HsEndpoint>) {
      const updated = {...endpoint, ...newEndpoint};
      (this.layman as any).set(updated);
      (this.authState as any).set({
        user: updated.user,
        authenticated: updated.authenticated,
      });
      (this.isAuthenticated as any).set(!!updated.authenticated);
      (this.user as any).set(updated.user);
      return updated;
    },

    // Override with any custom methods provided
    ...customMethods,
  };
}
