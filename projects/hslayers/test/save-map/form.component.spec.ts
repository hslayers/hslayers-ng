import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  flush,
} from '@angular/core/testing';
import {Component, Input, signal, WritableSignal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Subject, of, Observable} from 'rxjs';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';

import {
  AccessRightsModel,
  HsGetMapsComposition,
  HsEndpoint,
} from 'hslayers-ng/types';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {
  HsSaveMapManagerService,
  HsSaveMapFormComponent,
  AdvancedOptionsComponent,
} from 'hslayers-ng/components/save-map';
import {
  HsCommonLaymanAccessRightsComponent,
  HsCommonLaymanService,
  HsLaymanCurrentUserComponent,
} from 'hslayers-ng/common/layman';
import {HsCompositionsParserService} from 'hslayers-ng/services/compositions';
import {HsToastService} from 'hslayers-ng/common/toast';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {HsSaveMapManagerServiceMock} from '../save-map-manager.service.mock';

// Helper function to create mock compositions
const createMockComposition = (
  overrides?: Partial<HsGetMapsComposition>,
): HsGetMapsComposition => {
  const defaults: HsGetMapsComposition = {
    access_rights: {read: ['EVERYONE'], write: ['testuser']},
    bounding_box: [0, 0, 10, 10],
    native_bounding_box: [0, 0, 10, 10],
    native_crs: 'EPSG:4326',
    name: 'Mock Composition',
    uuid: 'mock-uuid-' + Math.random(),
    url: '/rest/workspaces/testuser/maps/mock-composition',
    workspace: 'testuser',
    // Add other required fields with default values
    updated_at: new Date().toISOString(),
    title: 'Mock Composition Title',
    publication_type: 'map',
  };
  return {...defaults, ...overrides};
};

// Mock components used in the template
@Component({
  selector: 'hs-save-map-advanced-options',
  template: '',
  standalone: true,
})
class MockAdvancedOptionsComponent {
  @Input() thumbnail: any;
  @Input() hidden: boolean;
}

class MockHsLayoutService {
  mainpanel$ = of('saveMap');
  mainpanel = 'saveMap';
  layoutElement = {
    querySelector: (selector: string) => {
      const el = document.createElement('input');
      el.focus = jasmine.createSpy('focus'); // Add spy for focus
      return el;
    },
  };
  _puremapApp = of(false);
}

// Mock endpoint data
const mockEndpoint: HsEndpoint = {
  type: 'layman-wagtail',
  title: 'layman',
  url: 'http://madeupurl',
  // user: 'current-user', // REMOVE user property from mock HsEndpoint
  // authenticated: true,
};

// Define a Mock CLASS for the service
class MockHsCommonLaymanService {
  layman$: Observable<HsEndpoint | undefined> = of(mockEndpoint);
  // Make layman signal read-only in the mock to match the real service
  layman = signal<HsEndpoint | undefined>(mockEndpoint).asReadonly();
  authState = signal({
    user: 'current-user',
    authenticated: true,
  });
  isAuthenticated = signal(true);
  // Use a writable signal for user in the mock class
  user: WritableSignal<string | undefined> = signal('current-user');

  // Add mock implementations for other methods if needed by child components
  getCurrentUser = (url) =>
    of({username: this.user(), authenticated: this.isAuthenticated()});
  logout = () => {
    this.user.set(undefined);
    this.isAuthenticated.set(false);
    this.authState.set({user: undefined, authenticated: false});
  };
}

class MockHsCompositionsParserService {
  currentCompositionRecord = new Subject<any>();
}

class MockHsToastService {
  show = jasmine.createSpy('show');
}

describe('HsSaveMapFormComponent', () => {
  let component: HsSaveMapFormComponent;
  let fixture: ComponentFixture<HsSaveMapFormComponent>;
  let hsSaveMapManagerService: HsSaveMapManagerServiceMock;
  let hsLayoutService: MockHsLayoutService;
  let hsCommonLaymanService: MockHsCommonLaymanService;
  let hsCompositionsParserService: MockHsCompositionsParserService;

  beforeEach(fakeAsync(async () => {
    hsSaveMapManagerService = new HsSaveMapManagerServiceMock();
    hsLayoutService = new MockHsLayoutService();
    hsCompositionsParserService = new MockHsCompositionsParserService();

    // Set initial state for the manager service's form
    hsSaveMapManagerService.compoData.controls.name.setValue('');
    hsSaveMapManagerService.compoData.controls.abstract.setValue('');
    hsSaveMapManagerService.compoData.controls.workspace.setValue('testuser');
    hsSaveMapManagerService.compoData.controls.access_rights.setValue({
      'access_rights.write': 'private',
      'access_rights.read': 'EVERYONE',
    });

    // Override the component to ensure the mock is used for the selector
    TestBed.overrideComponent(HsSaveMapFormComponent, {
      // Remove the real component
      remove: {imports: [AdvancedOptionsComponent]},
      // Add the mock component to be available for the template selector
      add: {imports: [MockAdvancedOptionsComponent]},
    });

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        NgbTooltipModule,
        TranslateCustomPipe,
        HsSaveMapFormComponent, // Component under test
        HsLaymanCurrentUserComponent,
        HsCommonLaymanAccessRightsComponent,
      ],
      providers: [
        {provide: HsSaveMapManagerService, useValue: hsSaveMapManagerService},
        {provide: HsLayoutService, useValue: hsLayoutService},
        {provide: HsCommonLaymanService, useClass: MockHsCommonLaymanService},
        {
          provide: HsCompositionsParserService,
          useValue: hsCompositionsParserService,
        },
        {provide: HsToastService, useClass: MockHsToastService},
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HsSaveMapFormComponent);
    component = fixture.componentInstance;

    hsCommonLaymanService = TestBed.inject(
      HsCommonLaymanService,
    ) as unknown as MockHsCommonLaymanService;

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle advanced options form', () => {
    expect(component.extraFormOpened).toBe('');
    component.setExtraFormTo('advancedOptions');
    expect(component.extraFormOpened).toBe('advancedOptions');
    component.setExtraFormTo('advancedOptions');
    expect(component.extraFormOpened).toBe('');
  });

  it('should patch access rights to form', () => {
    const spy = spyOn(
      hsSaveMapManagerService.compoData,
      'patchValue',
    ).and.callThrough();
    const newRights: AccessRightsModel = {
      'access_rights.write': 'EVERYONE',
      'access_rights.read': 'private',
    };
    component.setAccessRights(newRights);
    expect(spy).toHaveBeenCalledWith({access_rights: newRights});
    expect(
      hsSaveMapManagerService.compoData.controls.access_rights.value,
    ).toEqual(newRights);
  });

  it('should mark missingAbstract as false when abstract changes', () => {
    hsSaveMapManagerService.missingAbstract = true;
    component.abstractChanged();
    expect(hsSaveMapManagerService.missingAbstract).toBeFalse();
  });

  it('should emit download event in local mode', () => {
    spyOn(component.download, 'emit');
    fixture.componentRef.setInput('local', true);
    fixture.detectChanges(); // Detect changes after input update

    const downloadButton = fixture.nativeElement.querySelector(
      'button[type="button"].btn-outline-primary',
    );
    expect(downloadButton).toBeTruthy(
      'Download button should exist in local mode',
    );
    downloadButton.click();
    expect(component.download.emit).toHaveBeenCalled();
  });

  // Test computed signals based on state
  describe('Computed Signals Logic', () => {
    beforeEach(fakeAsync(() => {
      // Reset mocks before each test in this block
      hsSaveMapManagerService.currentCompositionEditable.set(false);
      hsSaveMapManagerService.currentComposition.set(null);
      hsSaveMapManagerService.existingComposition.set(null);
      hsCompositionsParserService.currentCompositionRecord.next(null);
      hsSaveMapManagerService.compoData.controls.name.setValue(
        'New Composition',
      );
      hsSaveMapManagerService.compoData.controls.workspace.setValue('testuser');
      component.overwriteNecessary.set(false);
      fixture.detectChanges(); // Trigger change detection for computed signals
      tick(300); // Wait for debounceTime
      fixture.detectChanges();
    }));

    it('should compute isMyComposition correctly', fakeAsync(() => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue('testuser');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      expect(component.isMyComposition()).toBeTrue();

      hsCommonLaymanService.user.set('anotheruser');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      expect(component.isMyComposition()).toBeFalse();
    }));

    it('should compute compositionWithThisNameExists correctly', fakeAsync(async () => {
      const currentCompo = createMockComposition({name: 'Current Name'});
      const existingCompo = createMockComposition({name: 'Existing Name'});

      hsSaveMapManagerService.currentComposition.set(currentCompo);
      hsSaveMapManagerService.existingComposition.set(null);
      hsSaveMapManagerService.compoData.controls.name.setValue('New Name');
      fixture.detectChanges();
      tick(300); // debounceTime
      fixture.detectChanges();

      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.compositionWithThisNameExists()).toBeFalse();

      hsSaveMapManagerService.compoData.controls.name.setValue('Current Name');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();

      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.compositionWithThisNameExists()).toBeTrue();

      hsSaveMapManagerService.currentComposition.set(null);
      hsSaveMapManagerService.existingComposition.set(existingCompo);
      hsSaveMapManagerService.compoData.controls.name.setValue('Existing Name');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();

      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.compositionWithThisNameExists()).toBeTrue();

      hsSaveMapManagerService.compoData.controls.name.setValue(
        'Another New Name',
      );
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();

      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.compositionWithThisNameExists()).toBeFalse();
    }));

    it('should determine available actions: save only (new, non-editable)', fakeAsync(async () => {
      hsSaveMapManagerService.currentCompositionEditable.set(false);
      hsSaveMapManagerService.compoData.controls.name.setValue('NewCompo');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.availableActions()).toEqual(['save']);
    }));

    it('should determine available actions: overwrite, rename (existing, mine, editable)', fakeAsync(async () => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue('testuser');
      hsSaveMapManagerService.currentCompositionEditable.set(true);
      hsSaveMapManagerService.currentComposition.set(
        createMockComposition({name: 'MyCompo'}),
      );
      hsSaveMapManagerService.compoData.controls.name.setValue('MyCompo');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.availableActions()).toEqual(['overwrite', 'rename']);
    }));

    it('should determine available actions: save (new, mine, editable)', fakeAsync(async () => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue('testuser');
      hsSaveMapManagerService.currentCompositionEditable.set(true);
      hsSaveMapManagerService.currentComposition.set(null); // No current compo loaded
      hsSaveMapManagerService.compoData.controls.name.setValue('MyNewCompo');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.availableActions()).toEqual(['save']);
    }));

    it('should determine available actions: overwrite, rename (existing, not mine, editable)', fakeAsync(async () => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue(
        'otheruser',
      ); // Owned by someone else
      hsSaveMapManagerService.currentCompositionEditable.set(true); // But I can edit it
      hsSaveMapManagerService.currentComposition.set(
        createMockComposition({name: 'SharedCompo', workspace: 'otheruser'}),
      );
      hsSaveMapManagerService.compoData.controls.name.setValue('SharedCompo');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.availableActions()).toEqual(['overwrite', 'rename']);
    }));

    it('should determine available actions: save (name changed from existing, editable)', fakeAsync(async () => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue(
        'otheruser',
      );
      hsSaveMapManagerService.currentCompositionEditable.set(true);
      hsSaveMapManagerService.currentComposition.set(
        createMockComposition({name: 'SharedCompo', workspace: 'otheruser'}),
      );
      hsSaveMapManagerService.compoData.controls.name.setValue(
        'MyVersionOfSharedCompo',
      ); // Renamed
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.availableActions()).toEqual(['save']);
    }));

    it('should determine available actions: rename (overwrite needed, exists, cannot edit existing)', fakeAsync(async () => {
      hsSaveMapManagerService.currentCompositionEditable.set(true); // Can edit the *loaded* one, but maybe not the *conflicting* one
      component.overwriteNecessary.set(true);
      hsSaveMapManagerService.statusData.canEditExistingComposition = false; // Cannot edit the one causing the conflict
      hsSaveMapManagerService.existingComposition.set(
        createMockComposition({name: 'ConflictCompo'}),
      ); // Simulate conflict state
      hsSaveMapManagerService.compoData.controls.name.setValue('ConflictCompo');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.availableActions()).toEqual(['rename']);
    }));

    it('should determine available actions: overwrite, rename (overwrite needed, exists, can edit existing)', fakeAsync(async () => {
      component.overwriteNecessary.set(true);
      hsSaveMapManagerService.statusData.canEditExistingComposition = true; // CAN edit the one causing the conflict
      hsSaveMapManagerService.existingComposition.set(
        createMockComposition({name: 'ConflictCompo'}),
      );
      hsSaveMapManagerService.compoData.controls.name.setValue('ConflictCompo');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.availableActions()).toEqual(['overwrite', 'rename']);
    }));

    it('should determine available actions: save (overwrite needed, name changed)', fakeAsync(async () => {
      component.overwriteNecessary.set(true);
      hsSaveMapManagerService.statusData.canEditExistingComposition = true;
      hsSaveMapManagerService.existingComposition.set(
        createMockComposition({name: 'ConflictCompo'}),
      );
      hsSaveMapManagerService.compoData.controls.name.setValue(
        'NoLongerConflictCompo',
      ); // Name changed
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      expect(component.availableActions()).toEqual(['save']);
    }));

    it('should generate correct tooltip text: not editable', fakeAsync(async () => {
      hsSaveMapManagerService.currentCompositionEditable.set(false);
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      const tooltip = component.contextTooltipText();
      expect(tooltip.text).toContain('You have no write access');
      expect(tooltip.iconClass).toBe('fa-solid fa-lock');
    }));

    it('should generate correct tooltip text: mine, exists', fakeAsync(async () => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue('testuser');
      hsSaveMapManagerService.currentCompositionEditable.set(true);
      hsSaveMapManagerService.currentComposition.set(
        createMockComposition({name: 'MyCompo'}),
      );
      hsSaveMapManagerService.compoData.controls.name.setValue('MyCompo');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      const tooltip = component.contextTooltipText();
      expect(tooltip.text).toContain('This is your composition');
      expect(tooltip.iconClass).toBe('fa-solid fa-user-pen');
    }));

    it('should generate correct tooltip text: mine, new name', fakeAsync(async () => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue('testuser');
      hsSaveMapManagerService.currentCompositionEditable.set(true);
      hsSaveMapManagerService.currentComposition.set(
        createMockComposition({name: 'MyCompo'}),
      ); // Loaded compo
      hsSaveMapManagerService.compoData.controls.name.setValue('MyNewCompo'); // Different name in form
      fixture.detectChanges();
      tick(500);
      fixture.detectChanges();
      flush();
      await fixture.whenStable();
      fixture.detectChanges();

      const tooltip = component.contextTooltipText();
      expect(tooltip.text).toContain('Ready to save as a new composition');
      expect(tooltip.iconClass).toBe('fa-solid fa-check-circle');
    }));

    it('should generate correct tooltip text: not mine, editable, exists', fakeAsync(async () => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue(
        'otheruser',
      );
      hsSaveMapManagerService.currentCompositionEditable.set(true);
      hsSaveMapManagerService.currentComposition.set(
        createMockComposition({name: 'SharedCompo', workspace: 'otheruser'}),
      );
      hsSaveMapManagerService.compoData.controls.name.setValue('SharedCompo');
      fixture.detectChanges();
      tick(300);
      fixture.detectChanges();
      flush();
      await fixture.whenStable(); // Wait for stability
      fixture.detectChanges(); // Final detect
      const tooltip = component.contextTooltipText();
      expect(tooltip.text).toContain('You have write access to update');
      expect(tooltip.text).toContain('Owned by: otheruser');
      expect(tooltip.iconClass).toBe('fa-solid fa-pencil');
    }));

    it('should generate correct tooltip text: not mine, editable, new name', fakeAsync(async () => {
      const name = component.compoName();
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue(
        'otheruser',
      );
      hsSaveMapManagerService.currentCompositionEditable.set(true);
      hsSaveMapManagerService.currentComposition.set(
        createMockComposition({name: 'SharedCompo', workspace: 'otheruser'}),
      );
      hsSaveMapManagerService.compoData.controls.name.setValue(
        'NewSharedCompo',
      ); // Name changed

      fixture.detectChanges();
      tick(500);
      fixture.detectChanges();
      flush();
      await fixture.whenStable();
      fixture.detectChanges();

      const tooltip = component.contextTooltipText();
      expect(tooltip.text).toContain('You have write access to save changes');
      expect(tooltip.iconClass).toBe('fa-solid fa-check-circle');
    }));
  });

  describe('Initiate Save Logic', () => {
    let initiateSaveSpy: jasmine.Spy;

    beforeEach(() => {
      // Get a reference to the spy created in the mock class
      initiateSaveSpy = hsSaveMapManagerService.initiateSave;
      // Reset calls and setup default return value for this block if needed
      initiateSaveSpy.calls.reset();
      initiateSaveSpy.and.returnValue(
        Promise.resolve({overWriteNeeded: false}),
      );

      // Ensure form is valid for saving
      hsSaveMapManagerService.compoData.controls.name.setValue('Valid Name');
      hsSaveMapManagerService.compoData.controls.abstract.setValue(
        'Valid Abstract',
      );
      fixture.detectChanges();
    });

    it('should call initiateSave on manager service when saving new', async () => {
      await component.initiateSave(true);
      expect(initiateSaveSpy).toHaveBeenCalledWith(true);
      expect(component.overwriteNecessary()).toBeFalse(); // Default mock response
    });

    it('should call initiateSave on manager service when overwriting', async () => {
      await component.initiateSave(false);
      expect(initiateSaveSpy).toHaveBeenCalledWith(false);
      expect(component.overwriteNecessary()).toBeFalse();
    });

    it('should set access rights correctly when overwriting another users composition', async () => {
      hsCommonLaymanService.user.set('currentUser'); // Set current user
      hsSaveMapManagerService.compoData.controls.workspace.setValue(
        'ownerUser',
      ); // Set composition owner
      hsSaveMapManagerService.currentCompositionEditable.set(true); // Ensure editable

      const accessRights = {
        'access_rights.write': 'private', // Initial state - owner only
        'access_rights.read': 'EVERYONE',
      };
      hsSaveMapManagerService.compoData.controls.access_rights.setValue(
        accessRights,
      );

      const patchSpy = spyOn(
        hsSaveMapManagerService.compoData,
        'patchValue',
      ).and.callThrough();

      await component.initiateSave(false); // Overwrite

      // Expect patchValue to be called BEFORE initiateSave with updated write rights
      expect(patchSpy).toHaveBeenCalledWith({
        access_rights: {
          'access_rights.write': 'ownerUser,currentUser', // Both users can write
          'access_rights.read': 'EVERYONE',
        },
      });
      expect(initiateSaveSpy).toHaveBeenCalledWith(false);
    });

    it('should NOT modify access rights when saving new', async () => {
      hsCommonLaymanService.user.set('currentUser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue(
        'ownerUser',
      );
      hsSaveMapManagerService.currentCompositionEditable.set(true); // Doesn't matter for saving new

      const accessRights = {
        'access_rights.write': 'private',
        'access_rights.read': 'EVERYONE',
      };
      hsSaveMapManagerService.compoData.controls.access_rights.setValue(
        accessRights,
      );

      const patchSpy = spyOn(
        hsSaveMapManagerService.compoData,
        'patchValue',
      ).and.callThrough();

      await component.initiateSave(true); // Save as New

      // Expect patchValue NOT to be called for access_rights modification
      const accessRightsCalls = patchSpy.calls
        .all()
        .filter((call) => call.args[0].hasOwnProperty('access_rights'));
      expect(accessRightsCalls.length).toBe(
        0,
        'Access rights should not be patched when saving new',
      );
      expect(initiateSaveSpy).toHaveBeenCalledWith(true);
    });

    it('should NOT modify access rights when overwriting own composition', async () => {
      hsCommonLaymanService.user.set('testuser');
      hsSaveMapManagerService.compoData.controls.workspace.setValue('testuser'); // My composition
      hsSaveMapManagerService.currentCompositionEditable.set(true);

      const accessRights = {
        'access_rights.write': 'private',
        'access_rights.read': 'EVERYONE',
      };
      hsSaveMapManagerService.compoData.controls.access_rights.setValue(
        accessRights,
      );

      const patchSpy = spyOn(
        hsSaveMapManagerService.compoData,
        'patchValue',
      ).and.callThrough();

      await component.initiateSave(false); // Overwrite my own

      const accessRightsCalls = patchSpy.calls
        .all()
        .filter((call) => call.args[0].hasOwnProperty('access_rights'));
      expect(accessRightsCalls.length).toBe(
        0,
        'Access rights should not be patched when overwriting own composition',
      );
      expect(initiateSaveSpy).toHaveBeenCalledWith(false);
    });

    it('should set overwriteNecessary signal based on manager service response', async () => {
      // Configure the spy's behavior for THIS test case
      initiateSaveSpy.and.callFake(async () => {
        // Simulate the manager service updating its internal state
        hsSaveMapManagerService.statusData.overWriteNeeded = true;
        // Return a resolved promise (matching the manager's return type)
        return Promise.resolve(hsSaveMapManagerService.statusData);
      });

      // Act: Call the component method
      await component.initiateSave(true);

      // Assert: Check the component's signal after the manager's call completes
      expect(component.overwriteNecessary()).toBeTrue();
    });

    it('should keep overwriteNecessary false after successful save', async () => {
      // Arrange: Simulate manager state after a successful save
      initiateSaveSpy.and.callFake(async () => {
        hsSaveMapManagerService.statusData.overWriteNeeded = false; // Success resets this
        return Promise.resolve(hsSaveMapManagerService.statusData);
      });

      // Act
      await component.initiateSave(true);

      // Assert
      expect(component.overwriteNecessary()).toBeFalse();
    });

    it('should keep overwriteNecessary false after non-conflict save error', async () => {
      // Arrange: Simulate manager state after a non-conflict error
      initiateSaveSpy.and.callFake(async () => {
        hsSaveMapManagerService.statusData.overWriteNeeded = false; // Non-conflict error also resets this
        // Simulate error status for completeness, though component doesn't check it directly for this signal
        hsSaveMapManagerService.statusData.status = false;
        hsSaveMapManagerService.statusData.error = {
          code: 99,
          message: 'Other error',
        };
        return Promise.resolve(hsSaveMapManagerService.statusData);
      });

      // Act
      await component.initiateSave(true);

      // Assert
      expect(component.overwriteNecessary()).toBeFalse();
    });
  });
});
