import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {signal} from '@angular/core';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';
import {provideHttpClient} from '@angular/common/http';

describe('HsCommonLaymanService', () => {
  let service: HsCommonLaymanService;
  let httpMock: HttpTestingController;
  let endpointsService: jasmine.SpyObj<HsCommonEndpointsService>;
  let toastService: jasmine.SpyObj<HsToastService>;
  let utilsService: jasmine.SpyObj<HsUtilsService>;
  let endpoints;

  const mockEndpoint = {
    type: 'layman',
    title: 'Layman',
    url: 'http://layman.test',
  };

  const mockEndpointWagtail = {
    type: 'layman-wagtail',
    title: 'Layman Wagtail',
    url: 'http://layman-wagtail.test',
  };

  // Helper function to handle version request
  function handleVersionRequest(url = mockEndpoint.url) {
    const versionReq = httpMock.expectOne(`${url}/rest/about/version`);
    expect(versionReq.request.method).toBe('GET');
    versionReq.flush({
      about: {
        applications: {
          layman: {
            version: '1.0.0',
          },
        },
      },
    });
  }

  // Helper function to handle current user request
  function handleUserRequest(
    url = mockEndpoint.url,
    authenticated = false,
    username = undefined,
  ) {
    const userReq = httpMock.expectOne(`${url}/rest/current-user`);
    expect(userReq.request.method).toBe('GET');
    userReq.flush({
      authenticated,
      username,
    });
  }

  beforeEach(fakeAsync(() => {
    // Create endpoints signal that we can control in tests
    endpoints = signal([mockEndpoint]);

    const endpointsSpy = jasmine.createSpyObj('HsCommonEndpointsService', [], {
      endpoints,
    });

    const toastSpy = jasmine.createSpyObj('HsToastService', [
      'createToastPopupMessage',
    ]);

    const utilsSpy = jasmine.createSpyObj('HsUtilsService', [
      'registerLaymanEndpoints',
    ]);

    const logSpy = jasmine.createSpyObj('HsLogService', ['error', 'warn']);

    const languageSpy = jasmine.createSpyObj(
      'HsLanguageService',
      ['getTranslation', 'getTranslationIgnoreNonExisting'],
      {
        getTranslation: (key) => key,
        getTranslationIgnoreNonExisting: (ns, key) => key,
      },
    );

    TestBed.configureTestingModule({
      providers: [
        HsCommonLaymanService,
        {provide: HsCommonEndpointsService, useValue: endpointsSpy},
        {provide: HsToastService, useValue: toastSpy},
        {provide: HsUtilsService, useValue: utilsSpy},
        {provide: HsLanguageService, useValue: languageSpy},
        {provide: HsLogService, useValue: logSpy},
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(HsCommonLaymanService);
    httpMock = TestBed.inject(HttpTestingController);
    endpointsService = TestBed.inject(
      HsCommonEndpointsService,
    ) as jasmine.SpyObj<HsCommonEndpointsService>;
    toastService = TestBed.inject(
      HsToastService,
    ) as jasmine.SpyObj<HsToastService>;
    utilsService = TestBed.inject(
      HsUtilsService,
    ) as jasmine.SpyObj<HsUtilsService>;

    // Allow time for service initialization
    tick(100);

    // Handle the initial version request
    handleVersionRequest();
  }));

  afterEach(() => {
    httpMock.verify();
  });

  // Test initialization with layman endpoint
  it('should initialize with layman endpoint', fakeAsync(() => {
    // Handle the current user request
    handleUserRequest();

    // Advance time to allow observables to complete
    tick(100);

    // Verify the endpoint is set correctly
    expect(service.layman()).toEqual({
      ...mockEndpoint,
      version: '1.0.0',
    });

    // Verify the auth state is set correctly
    expect(service.authState()).toEqual({
      authenticated: false,
      user: undefined,
    });

    // Verify the utils service was called to register the endpoint
    expect(utilsService.registerLaymanEndpoints).toHaveBeenCalledWith(
      mockEndpoint.url,
    );
  }));

  // Test handling of layman-wagtail endpoint
  it('should handle layman-wagtail endpoint', fakeAsync(() => {
    // Handle the current user request from the initial setup
    handleUserRequest();

    // Update endpoints to include wagtail
    endpoints.set([mockEndpointWagtail]);

    // Allow time for the endpoint change to propagate
    tick(100);

    // Handle the version request for wagtail
    handleVersionRequest(mockEndpointWagtail.url);

    // Handle the user request for wagtail with authenticated user
    handleUserRequest(mockEndpointWagtail.url, true, 'wagtail-user');

    // Advance time to allow observables to complete
    tick(100);

    // Check that the endpoint is set correctly
    expect(service.layman()).toEqual({
      ...mockEndpointWagtail,
      version: '1.0.0',
    });

    // Check that the auth state is set correctly
    expect(service.authState()).toEqual({
      authenticated: true,
      user: 'wagtail-user',
    });
  }));

  // Test auth state changes triggered by login action (success)
  it('should update auth state on login action - success', fakeAsync(() => {
    // Handle the current user request from the initial setup
    handleUserRequest();

    // Advance time to complete initialization
    tick(100);

    // Initial state should be unauthenticated
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeUndefined();

    // Trigger login action
    service.login$.next();

    // Advance time to trigger the first poll (timer(1000))
    tick(1000);

    // First poll attempt
    handleUserRequest(mockEndpoint.url, false);

    // Since the first poll returns unauthenticated, the retry mechanism will kick in
    // We need to advance time by USER_POLL_DELAY (2500ms)
    tick(service['USER_POLL_DELAY'] + 1000);

    // Second poll attempt (should happen immediately after flush)
    handleUserRequest(mockEndpoint.url, true, 'test-user');

    // Advance time to complete any pending operations
    tick(1000);

    // Auth state should now be authenticated
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.user()).toBe('test-user');

    // Should show success toast
    expect(toastService.createToastPopupMessage).toHaveBeenCalledWith(
      'COMMON.success',
      'AUTH.loginSuccessful',
      jasmine.any(Object),
    );
  }));

  // Test auth state changes triggered by logout action
  it('should update auth state on logout action', fakeAsync(() => {
    // Handle the current user request from the initial setup with authenticated user
    handleUserRequest(mockEndpoint.url, true, 'test-user');

    // Advance time to complete initialization
    tick(100);

    // Initial state should be authenticated
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.user()).toBe('test-user');

    // Trigger logout action
    service.logout$.next();

    // Advance time to complete any pending operations
    tick(100);

    // Auth state should now be unauthenticated
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.user()).toBeUndefined();

    // Should show success toast
    expect(toastService.createToastPopupMessage).toHaveBeenCalledWith(
      'AUTH.Logout',
      'AUTH.logoutSuccessful',
      jasmine.any(Object),
    );
  }));

  // Test the logout method
  it('should call logout endpoint and emit logout action', fakeAsync(() => {
    // Handle the current user request from the initial setup with authenticated user
    handleUserRequest(mockEndpoint.url, true, 'test-user');

    // Advance time to complete initialization
    tick(100);

    // Spy on logout$ subject
    spyOn(service.logout$, 'next').and.callThrough();

    // Call logout method
    service.logout();

    // Expect a request to the logout endpoint
    const logoutReq = httpMock.expectOne(`${mockEndpoint.url}/logout`);
    expect(logoutReq.request.method).toBe('GET');
    logoutReq.flush({});

    // Advance time to complete any pending operations
    tick(100);

    // Should emit logout action
    expect(service.logout$.next).toHaveBeenCalled();
  }));

  // Test tracking authentication in progress
  it('should track authentication in progress', fakeAsync(() => {
    // Handle the current user request from the initial setup
    handleUserRequest();

    // Advance time to complete initialization
    tick(100);

    // Initially not authenticating
    expect(service.isAuthenticating()).toBeFalse();

    // Trigger login action
    service.login$.next();

    // Should now be authenticating
    expect(service.isAuthenticating()).toBeTrue();

    // Advance time to trigger the poll
    tick(1000);

    // First poll attempt
    handleUserRequest(mockEndpoint.url, true, 'test-user');

    // Advance time to complete any pending operations
    tick(100);

    // Should no longer be authenticating
    expect(service.isAuthenticating()).toBeFalse();
  }));

  // Test displayLaymanError method
  it('should display layman error messages correctly', fakeAsync(() => {
    // Handle the current user request from the initial setup
    handleUserRequest();

    // Advance time to complete initialization
    tick(100);

    // Test with code 48
    service.displayLaymanError(mockEndpoint, 'Error message', {code: 48});

    expect(toastService.createToastPopupMessage).toHaveBeenCalledWith(
      'Error message',
      'Layman: mapExtentFilterMissing',
      jasmine.objectContaining({
        disableLocalization: true,
        serviceCalledFrom: 'HsCommonLaymanService',
        type: 'danger',
      }),
    );

    // Test with code 32
    service.displayLaymanError(mockEndpoint, 'Error message', {code: 32});

    expect(toastService.createToastPopupMessage).toHaveBeenCalledWith(
      'Error message',
      'Layman: Authentication failed. Login to the catalogue.',
      jasmine.objectContaining({
        disableLocalization: true,
        serviceCalledFrom: 'HsCommonLaymanService',
        type: 'danger',
      }),
    );

    // Test with other code and message
    service.displayLaymanError(mockEndpoint, 'Error message', {
      code: 99,
      message: 'Custom error',
      detail: 'More details',
    });

    expect(toastService.createToastPopupMessage).toHaveBeenCalledWith(
      'Error message',
      'Layman: Custom error More details',
      jasmine.objectContaining({
        disableLocalization: true,
        serviceCalledFrom: 'HsCommonLaymanService',
        type: 'danger',
      }),
    );
  }));
});
