import {TestBed} from '@angular/core/testing';
import {HttpClient} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {signal, WritableSignal} from '@angular/core';
import {Subject, of} from 'rxjs';

import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSaveMapManagerService} from 'hslayers-ng/components/save-map';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsShareService} from 'hslayers-ng/components/share'; // Assuming HsSaverService is implemented here or mock needed
import {HsLaymanService} from 'hslayers-ng/services/save-map'; // Assuming HsSaverService is implemented here or mock needed
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsCompositionsParserService} from 'hslayers-ng/services/compositions';
import {HsToastService} from 'hslayers-ng/common/toast';
import {LaymanCompositionDescriptor} from 'hslayers-ng/types';

// Mock Services
class MockHsMapService {}
class MockHsSaveMapService {}
class MockHsShareService {}
class MockHsLaymanService {}
class MockHsLayoutService {}
class MockHsEventBusService {
  mapResets = new Subject<void>();
  compositionLoads = new Subject<any>();
}
class MockHsLogService {
  log = jasmine.createSpy('log');
  error = jasmine.createSpy('error');
}
class MockHsCompositionsParserService {
  currentCompositionRecord = new Subject<any>();
  current_composition_url: string | undefined;
}
class MockHsToastService {
  show = jasmine.createSpy('show');
}

// Writable Signal Mock for CommonLaymanService user
class MockHsCommonLaymanService {
  user: WritableSignal<string | undefined> = signal(undefined);
  layman = signal(undefined); // Add layman signal if needed by service constructor/methods
}

// Helper to create mock metadata
const createMockMetadata = (
  overrides: Partial<LaymanCompositionDescriptor> & {
    access_rights: {read: string[]; write: string[]};
    url: string; // Make url required for parsing workspace
  },
): LaymanCompositionDescriptor => {
  const defaults: LaymanCompositionDescriptor = {
    // Fill with default values if needed, but access_rights and url are key
    name: 'Test Composition',
    title: 'Test Composition Title',
    uuid: 'test-uuid',
    updated_at: new Date().toISOString(),
    description: 'Mock description',
    layman_metadata: {publication_status: 'COMPLETE'},
    metadata: {identifier: '', record_url: '', csw_url: '', comparison_url: ''},
    thumbnail: {path: '', url: ''}, // Correct thumbnail properties
    file: {path: '', name: ''}, // Add default for file
    bounding_box: [0, 0, 0, 0], // Add default for bounding_box
    native_bounding_box: [0, 0, 0, 0], // Add default for native_bounding_box
    native_crs: 'EPSG:4326', // Add default for native_crs
    publication_type: 'map', // Add default for publication_type
    workspace: 'testUser', // Add default for workspace
    // Other properties...
    ...overrides, // access_rights and url must be provided
  };
  return defaults;
};

describe('HsSaveMapManagerService', () => {
  let service: HsSaveMapManagerService;
  let hsCommonLaymanService: MockHsCommonLaymanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HsSaveMapManagerService,
        {provide: HsMapService, useClass: MockHsMapService},
        {provide: HsSaveMapService, useClass: MockHsSaveMapService},
        {provide: HttpClient, useValue: {}}, // Provide basic HttpClient mock if needed
        {provide: HsShareService, useClass: MockHsShareService},
        {provide: HsLaymanService, useClass: MockHsLaymanService},
        {provide: HsLayoutService, useClass: MockHsLayoutService},
        {provide: HsEventBusService, useClass: MockHsEventBusService},
        {provide: HsLogService, useClass: MockHsLogService},
        {
          provide: HsCompositionsParserService,
          useClass: MockHsCompositionsParserService,
        },
        {
          provide: HsCommonLaymanService,
          useClass: MockHsCommonLaymanService,
        },
        {provide: HsToastService, useClass: MockHsToastService},
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(HsSaveMapManagerService);
    hsCommonLaymanService = TestBed.inject(
      HsCommonLaymanService,
    ) as unknown as MockHsCommonLaymanService;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseAccessRights', () => {
    const currentUser = 'testUser';
    const otherUser = 'otherUser';

    beforeEach(() => {
      // Set the current user for tests
      hsCommonLaymanService.user.set(currentUser);
      // Reset access rights before each test
      service._access_rights = {
        'access_rights.write': 'private', // Default starting state
        'access_rights.read': 'EVERYONE',
      };
      service.currentCompositionEditable.set(false); // Default starting state
    });

    it('should handle MY composition with PRIVATE rights', () => {
      const metadata = createMockMetadata({
        url: `/rest/workspaces/${currentUser}/maps/myMap`,
        access_rights: {read: [currentUser], write: [currentUser]},
      });

      const workspace = service.parseAccessRights(metadata);

      expect(workspace).toBe(currentUser);
      expect(service.currentCompositionEditable()).toBeTrue();
      expect(service._access_rights['access_rights.write']).toBe('private');
      expect(service._access_rights['access_rights.read']).toBe('private');
    });

    it('should handle MY composition with PUBLIC rights', () => {
      const metadata = createMockMetadata({
        url: `/rest/workspaces/${currentUser}/maps/myMap`,
        access_rights: {
          read: [currentUser, 'EVERYONE'],
          write: [currentUser, 'EVERYONE'],
        },
      });

      const workspace = service.parseAccessRights(metadata);

      expect(workspace).toBe(currentUser);
      expect(service.currentCompositionEditable()).toBeTrue();
      expect(service._access_rights['access_rights.write']).toBe('EVERYONE');
      expect(service._access_rights['access_rights.read']).toBe('EVERYONE');
    });

    it('should handle MY composition shared with SPECIFIC users', () => {
      const specificUser1 = 'colleague1';
      const specificUser2 = 'colleague2';
      const metadata = createMockMetadata({
        url: `/rest/workspaces/${currentUser}/maps/myMap`,
        access_rights: {
          read: [currentUser, specificUser1, specificUser2],
          write: [currentUser, specificUser1],
        },
      });

      const workspace = service.parseAccessRights(metadata);

      expect(workspace).toBe(currentUser);
      expect(service.currentCompositionEditable()).toBeTrue();
      // Order might vary, split and sort for robust check
      expect(
        service._access_rights['access_rights.write'].split(',').sort(),
      ).toEqual([currentUser, specificUser1].sort());
      expect(
        service._access_rights['access_rights.read'].split(',').sort(),
      ).toEqual([currentUser, specificUser1, specificUser2].sort());
    });

    it('should handle OTHER USER composition where I have specific WRITE access', () => {
      const metadata = createMockMetadata({
        url: `/rest/workspaces/${otherUser}/maps/theirMap`,
        access_rights: {
          read: [otherUser, currentUser, 'EVERYONE'], // Readable by me and everyone
          write: [otherUser, currentUser], // Writable by owner and me
        },
      });

      const workspace = service.parseAccessRights(metadata);

      expect(workspace).toBe(otherUser);
      expect(service.currentCompositionEditable()).toBeTrue();
      // Should keep owner + current user
      expect(
        service._access_rights['access_rights.write'].split(',').sort(),
      ).toEqual([otherUser, currentUser].sort());
      // Should become the original joined string as per privateOrPublic logic
      const expectedRead = [otherUser, currentUser, 'EVERYONE'].sort();
      expect(
        service._access_rights['access_rights.read'].split(',').sort(),
      ).toEqual(expectedRead);
    });

    it('should handle OTHER USER composition with PUBLIC write access', () => {
      const metadata = createMockMetadata({
        url: `/rest/workspaces/${otherUser}/maps/theirPublicMap`,
        access_rights: {
          read: [otherUser, 'EVERYONE'],
          write: [otherUser, 'EVERYONE'], // Public write access
        },
      });

      const workspace = service.parseAccessRights(metadata);

      expect(workspace).toBe(otherUser);
      expect(service.currentCompositionEditable()).toBeTrue(); // Editable because public write
      // Should translate to EVERYONE
      expect(service._access_rights['access_rights.write']).toBe('EVERYONE');
      expect(service._access_rights['access_rights.read']).toBe('EVERYONE');
    });

    it('should handle OTHER USER composition where I have NO write access', () => {
      const metadata = createMockMetadata({
        url: `/rest/workspaces/${otherUser}/maps/theirPrivateMap`,
        access_rights: {
          read: [otherUser, currentUser, 'EVERYONE'], // I can read
          write: [otherUser], // But only owner can write
        },
      });

      const workspace = service.parseAccessRights(metadata);

      expect(workspace).toBe(otherUser);
      expect(service.currentCompositionEditable()).toBeFalse(); // Not editable by me
      // Should reset to component defaults (private write, EVERYONE read) because not editable
      expect(service._access_rights['access_rights.write']).toBe('private');
      expect(service._access_rights['access_rights.read']).toBe('EVERYONE');
    });

    // ... potentially add edge cases like empty access rights arrays if relevant
  });
});
