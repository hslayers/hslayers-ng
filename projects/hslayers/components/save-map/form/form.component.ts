import {
  Component,
  computed,
  inject,
  input,
  signal,
  Output,
  EventEmitter,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {startWith, Observable, map, debounceTime} from 'rxjs';

import {AccessRightsModel} from 'hslayers-ng/types';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsSaveMapManagerService} from '../save-map-manager.service';
import {
  HsCommonLaymanAccessRightsComponent,
  HsCommonLaymanService,
  HsLaymanCurrentUserComponent,
} from 'hslayers-ng/common/layman';
import {HsCompositionsParserService} from 'hslayers-ng/services/compositions';
import {AsyncPipe} from '@angular/common';
import {NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {AdvancedOptionsComponent} from './advanced-options/advanced-options.component';
import {ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'hs-save-map-form',
  templateUrl: './form.component.html',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    NgbTooltipModule,
    TranslateCustomPipe,
    AdvancedOptionsComponent,
    HsCommonLaymanAccessRightsComponent,
    HsLaymanCurrentUserComponent,
  ],
})
export class HsSaveMapFormComponent {
  @Output() download = new EventEmitter<void>();
  private hsCommonLaymanService = inject(HsCommonLaymanService);
  private hsCompositionsParserService = inject(HsCompositionsParserService);

  local = input<boolean>(false);

  /**
   *  Check if current user can overwrite the composition data
   */
  canOverwrite = this.hsSaveMapManagerService.currentCompositionEditable;
  overwriteNecessary = signal(false);
  isEditable = this.hsSaveMapManagerService.currentCompositionEditable;

  currentComposition = toSignal(
    this.hsCompositionsParserService.currentCompositionRecord,
    {
      initialValue: null,
    },
  );

  compoWorkspace = toSignal(
    this.hsSaveMapManagerService.compoData.controls.workspace.valueChanges.pipe(
      startWith(
        this.hsSaveMapManagerService.compoData.controls.workspace.value,
      ),
    ),
    {
      initialValue: null,
    },
  );

  compoName = toSignal(
    this.hsSaveMapManagerService.compoData.controls.name.valueChanges.pipe(
      startWith(this.hsSaveMapManagerService.compoData.controls.name.value),
      debounceTime(250),
    ),
  );

  isMyComposition = computed(() => {
    return this.compoWorkspace() === this.hsCommonLaymanService.user();
  });

  compositionWithThisNameExists = computed(() => {
    const currentCompositionName =
      this.hsSaveMapManagerService.currentComposition()?.name;
    const currentFormName = this.compoName();
    const existingCompositionName =
      this.hsSaveMapManagerService.existingComposition()?.name;
    return (
      currentFormName === currentCompositionName ||
      currentFormName === existingCompositionName
    );
  });

  availableActions = computed(() => {
    const exists = this.compositionWithThisNameExists();
    const overwriteNecessary = this.overwriteNecessary();
    if (overwriteNecessary) {
      if (exists) {
        return this.hsSaveMapManagerService.statusData
          .canEditExistingComposition
          ? ['overwrite', 'rename']
          : ['rename'];
      }
      //Name was changed and is no longer same as existing composition
      return ['save'];
    }

    if (!this.isEditable()) {
      return ['save'];
    }
    if (this.isMyComposition()) {
      return exists ? ['overwrite', 'rename'] : ['save'];
    }
    if (this.isEditable()) {
      return exists ? ['overwrite', 'rename'] : ['save'];
    }
    return ['save'];
  });

  contextTooltipText = computed(() => {
    const result = {text: '', iconClass: 'fa-solid fa-circle-info'};
    if (!this.isEditable()) {
      result.text = 'SAVECOMPOSITION.form.noWriteAccess';
      result.iconClass = 'fa-solid fa-lock';
    } else if (this.isMyComposition()) {
      if (this.compositionWithThisNameExists()) {
        result.text = 'SAVECOMPOSITION.form.myCompositionExists';
        result.iconClass = 'fa-solid fa-user-pen';
      } else {
        result.text = 'SAVECOMPOSITION.form.readyToSave';
        result.iconClass = 'fa-solid fa-check-circle';
      }
    } else if (this.isEditable()) {
      if (this.compositionWithThisNameExists()) {
        result.text = 'SAVECOMPOSITION.form.writeAccessExists';
        if (!this.isMyComposition()) {
          result.text = 'SAVECOMPOSITION.form.ownedBy';
        }
        result.iconClass = 'fa-solid fa-pencil';
      } else {
        result.text = 'SAVECOMPOSITION.form.writeAccessSave';
        result.iconClass = 'fa-solid fa-check-circle';
      }
    }
    return result;
  });

  downloadableData: string;
  extraFormOpened = '';

  isVisible: Observable<boolean>;

  constructor(
    public hsSaveMapManagerService: HsSaveMapManagerService,
    private hsLayoutService: HsLayoutService,
  ) {
    this.isVisible = this.hsLayoutService.mainpanel$.pipe(
      startWith(this.hsLayoutService.mainpanel),
      map((panel) => {
        return panel === 'saveMap';
      }),
    );
  }

  /**
   * Set extra form that will get opened
   * @param form - Form name that needs to be opened
   */
  setExtraFormTo(form: string): void {
    if (this.extraFormOpened === form) {
      this.extraFormOpened = '';
    } else {
      this.extraFormOpened = form;
    }
  }

  /**
   * Manually set access rights on form as component itself is not compatible with reactive forms
   */
  setAccessRights(data: AccessRightsModel) {
    this.hsSaveMapManagerService.compoData.patchValue({
      access_rights: data,
    });
  }

  /**
   * Triggered when composition's abstract input field receives user's input
   */
  abstractChanged(): void {
    this.hsSaveMapManagerService.missingAbstract = false;
  }

  /**
   * Visual clue for user to rename the composition
   */
  rename(): void {
    this.hsLayoutService.layoutElement
      .querySelector('[name="hs-save-map-name"]')
      .focus();
  }

  /**
   * Initiate composition's saving procedure
   * @param newSave - If true save a new composition, otherwise overwrite to current one
   */
  async initiateSave(newSave: boolean): Promise<void> {
    /***
     * Overwriting composition of other user and making it private
     *  = access for owner + current user
     */
    const currentUser = this.hsCommonLaymanService.user();
    const workspace =
      this.hsSaveMapManagerService.compoData.get('workspace').value;
    if (newSave == false && this.canOverwrite() && currentUser !== workspace) {
      const access =
        this.hsSaveMapManagerService.compoData.get('access_rights');
      this.hsSaveMapManagerService.compoData.patchValue({
        access_rights: {
          ...access.value,
          'access_rights.write': [workspace, currentUser].join(','),
        },
      });
    }
    await this.hsSaveMapManagerService.initiateSave(newSave);
    this.overwriteNecessary.set(
      this.hsSaveMapManagerService.statusData.overWriteNeeded,
    );
  }
}
