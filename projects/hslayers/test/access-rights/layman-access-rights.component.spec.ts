import {CommonModule} from '@angular/common';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, signal} from '@angular/core';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {BehaviorSubject, of} from 'rxjs';

import {
  AccessRights,
  GrantingOptions,
  HsCommonLaymanAccessRightsComponent,
} from 'hslayers-ng/common/layman/access-rights/layman-access-rights.component';
import {FilterPipe} from 'hslayers-ng/common/pipes';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

const mockUsersFromLayman = [
  {
    'family_name': 'cd',
    'given_name': 'ab',
    'middle_name': null,
    'name': 'ab cd',
    'screen_name': 'abc',
    'username': 'current-user',
  },
  {
    'family_name': 'cd',
    'given_name': 'ab',
    'middle_name': null,
    'name': 'ab cd',
    'screen_name': 'abc',
    'username': 'abc',
  },
  {
    'family_name': 'Gnajdr',
    'given_name': 'Aleg',
    'middle_name': null,
    'name': 'Aleg Hnajdr',
    'screen_name': 'ales',
    'username': 'ales',
  },
];

const mockedUsersFromWagtail = [
  {
    'username': 'current-user',
    'roles': [
      {
        'id': 3,
        'name': 'Editors',
      },
      {
        'id': 2,
        'name': 'Moderators',
      },
    ],
  },
  {
    'username': 'abc',
    'roles': [
      {
        'id': 2,
        'name': 'Moderators',
      },
    ],
  },
  {
    'username': 'ales',
    'roles': [
      {
        'id': 2,
        'name': 'Moderators',
      },
    ],
  },
];

const perUserAccessRights = {
  'access_rights.write': 'current-user',
  'access_rights.read': 'current-user,abc',
};

const perRoleAccessRights = {
  'access_rights.write': 'EDITORS',
  'access_rights.read': 'MODERATORS, EDITORS',
};

const parsedRoles = [
  {
    'name': 'EDITORS',
    'read': true,
    'write': false,
  },
  {
    'name': 'MODERATORS',
    'read': true,
    'write': true,
  },
];

describe('HsCommonLaymanAccessRightsComponent', () => {
  let component: HsCommonLaymanAccessRightsComponent;
  let fixture: ComponentFixture<HsCommonLaymanAccessRightsComponent>;
  let httpMock: HttpTestingController;
  let commonLaymanMock: HsCommonLaymanService;

  // Mock endpoint data
  const mockEndpoint = {
    type: 'layman-wagtail',
    title: 'layman',
    url: 'http://madeupurl',
    user: 'current-user',
    authenticated: true,
  };

  beforeEach(async () => {
    // Create a mock service
    const mockLaymanService = {
      layman$: of(mockEndpoint),
      layman: signal(mockEndpoint),
      authState: signal({
        user: 'current-user',
        authenticated: true,
      }),
      isAuthenticated: signal(true),
      user: signal('current-user'),
    };

    await TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      imports: [CommonModule, TranslateCustomPipe, FilterPipe],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: HsCommonLaymanService, useValue: mockLaymanService},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    commonLaymanMock = TestBed.inject(HsCommonLaymanService);
    fixture = TestBed.createComponent(HsCommonLaymanAccessRightsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Make sure that there are no outstanding requests
  });

  it('should create and initialize with default state - per user from layman', fakeAsync(() => {
    component.access_rights = perUserAccessRights;
    // Update the mock endpoint for this test
    (commonLaymanMock as any).layman.set({
      type: 'layman',
      title: 'layman',
      url: 'http://madeupurl',
      user: 'current-user',
      authenticated: true,
    });
    fixture.detectChanges();
    tick(1000);
    expect(component).toBeTruthy();

    // Expect an HTTP GET request to be made to the Layman URL
    const req = httpMock.expectOne(`${component.endpoint.url}/rest/users`);
    expect(req.request.method).toBe('GET');
    // Simulate a successful response with mockUsers
    req.flush(mockUsersFromLayman);
    tick(2000);
    // Check that users are set correctly
    expect(component.allUsers.length).toEqual(3);
    expect(component.currentOption).toEqual('perUser');
    expect(component.allUsers[1].read).toBeTruthy();
    expect(component.allUsers[1].write).toBeFalsy();
  }));

  it('should create and initialize with default state - per user from Wagtail', fakeAsync(() => {
    component.access_rights = perUserAccessRights;
    fixture.detectChanges();
    expect(component).toBeTruthy();

    // Expect an HTTP GET request to be made to the Layman URL
    const req = httpMock.expectOne(`/users`);
    expect(req.request.method).toBe('GET');
    // Simulate a successful response with mockUsers
    req.flush(mockedUsersFromWagtail);
    tick(2000);
    // Check that users are set correctly
    expect(component.allUsers.length).toEqual(3);
    expect(component.currentOption).toEqual('perUser');
    expect(component.allUsers[0].role).toHaveSize(2);
  }));

  it('should create and initialize with default state (per role) and parse to users', fakeAsync(() => {
    component.access_rights = perRoleAccessRights;
    // Ensure we're using layman type for this test
    (commonLaymanMock as any).layman.set({
      type: 'layman',
      title: 'layman',
      url: 'http://madeupurl',
      user: 'current-user',
      authenticated: true,
    });
    fixture.detectChanges();
    expect(component).toBeTruthy();

    // Expect an HTTP GET request to be made to the Layman URL
    const req = httpMock.expectOne(`${component.endpoint.url}/rest/roles`);
    expect(req.request.method).toBe('GET');
    // Simulate a successful response with mockRoles
    req.flush(['MODERATORS', 'EDITORS', 'EVERYONE']);
    tick(1000);
    expect(component.allRoles.length).toEqual(2);
    expect(component.currentOption).toEqual('perRole');

    component.changeGrantingOptions(GrantingOptions.PERUSER);
    // Expect an HTTP GET request to be made to the Layman URL
    const userReq = httpMock.expectOne(`${component.endpoint.url}/rest/users`);
    expect(userReq.request.method).toBe('GET');
    // Simulate a successful response with mockUsers
    userReq.flush(mockedUsersFromWagtail);
    tick(2000);
    expect(component.allUsers.length).toEqual(3);
    expect(component.currentOption).toEqual('perUser');
    expect(component.allUsers[0].role).toHaveSize(2);
  }));

  it('Should identify user based on role and grant access', () => {
    component.access_rights = {
      'access_rights.write': '',
      'access_rights.read': '',
    };
    component.endpoint = (commonLaymanMock as any).layman();
    component.allRoles = parsedRoles;
    component.currentOption = GrantingOptions.PERROLE;
    //Set up role based access rights
    component.setAcessRightsFromActor('write', GrantingOptions.PERROLE);
    //Check for users acesss
    const withAccess = component.userHasAccess(
      {...mockUsersFromLayman[0], role: ['MODERATORS']},
      component.access_rights[AccessRights.WRITE].split(','),
      'write',
    );

    expect(withAccess).toBeTruthy();
  });

  it('should automatically grant read access when granting write ', fakeAsync(() => {
    component.access_rights = perUserAccessRights;
    fixture.detectChanges();
    component.allRoles = parsedRoles;
    component.endpoint = commonLaymanMock.layman();

    // Expect an HTTP GET request to be made to the Layman URL
    const userReq = httpMock.expectOne('/users');
    expect(userReq.request.method).toBe('GET');
    // Simulate a successful response with mockUsers
    userReq.flush(mockedUsersFromWagtail);
    tick(1000);
    expect(component.allUsers.length).toEqual(3);
    expect(component.currentOption).toEqual('perUser');
    expect(component.allUsers[2].read).toBeFalse();

    component.allUsers[2].write = true; //Input click
    component.rightsChangedPerActor('write', 'ales', GrantingOptions.PERUSER, {
      target: {checked: true},
    });

    expect(component.allUsers[2].read).toBeTrue();
    expect(component.allUsers[2].write).toBeTrue();
  }));
});
