import {Subject} from 'rxjs';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {WritableSignal, signal} from '@angular/core';

import {HsSaveMapManagerParams} from 'hslayers-ng/components/save-map';
import {
  AccessRightsModel,
  HsGetMapsComposition,
  StatusData,
} from 'hslayers-ng/types';

export class HsSaveMapManagerServiceMock extends HsSaveMapManagerParams {
  // Use WritableSignal for signals in mocks
  currentCompositionEditable: WritableSignal<boolean> = signal(false);
  currentComposition: WritableSignal<HsGetMapsComposition | null> =
    signal(null);
  existingComposition: WritableSignal<HsGetMapsComposition | undefined> =
    signal(undefined);

  statusData: StatusData = {
    success: undefined,
    canEditExistingComposition: undefined,
    overWriteNeeded: false,
  };
  missingAbstract = false;

  // Re-declare compoData as it's defined in the base class but needs initialization here
  compoData = new FormGroup({
    name: new FormControl('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    abstract: new FormControl('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    workspace: new FormControl<string | undefined>(undefined),
    keywords: new FormControl(''),
    id: new FormControl(''),
    thumbnail: new FormControl(undefined),
    access_rights: new FormControl<AccessRightsModel>({
      'access_rights.write': 'private',
      'access_rights.read': 'EVERYONE',
    }),
  });

  constructor() {
    super();
  }
  panelOpened: Subject<any> = new Subject();

  initiateSave = jasmine.createSpy('initiateSave').and.callFake(() =>
    Promise.resolve({
      overWriteNeeded: false, // Default mock response
    }),
  );

  // Add other methods used by the component if needed
  // For example, if the component calls canEditExistingComposition
  canEditExistingComposition = jasmine
    .createSpy('canEditExistingComposition')
    .and.returnValue(Promise.resolve(true));
}
