import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  ViewRef,
  WritableSignal,
} from '@angular/core';

import {
  AccessRightsModel,
  HsAddDataLaymanLayerDescriptor,
  HsEndpoint,
  UpsertLayerObject,
} from 'hslayers-ng/types';
import {
  HsCommonLaymanAccessRightsComponent,
  HsCommonLaymanService,
  PostPatchLayerResponse,
} from 'hslayers-ng/common/layman';
import {
  HsDialogComponent,
  HsDialogContainerService,
  HsDialogItem,
} from 'hslayers-ng/common/dialogs';
import {HsLaymanService} from 'hslayers-ng/services/save-map';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-set-permissions-dialog',
  templateUrl: './set-permissions.component.html',
  imports: [TranslateCustomPipe, HsCommonLaymanAccessRightsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsSetPermissionsDialogComponent
  implements HsDialogComponent, OnInit
{
  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  access_rights: AccessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  /**
   * @param onPermissionSaved - Callback method as service instance and method name.
   * Pass service as property to not pollute the component
   * and because component is constructed dynamically via dialog service (no input)
   */
  data: {
    recordType: string;
    selectedRecord: HsAddDataLaymanLayerDescriptor;
    onPermissionSaved: {
      service: any;
      method: string;
    };
  };
  endpoint: HsEndpoint;
  state: WritableSignal<'idle' | 'loading' | 'success' | 'error'> =
    signal('idle');

  constructor(
    public hsCommonLaymanService: HsCommonLaymanService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLaymanService: HsLaymanService,
  ) {}

  ngOnInit(): void {
    // Can set permission for Layman endpoint only
    this.endpoint = this.hsCommonLaymanService.layman();
    if (!this.data.selectedRecord?.access_rights || !this.endpoint) {
      this.close();
      return;
    }
    this.parseCurrentPermissions();
  }

  /**
   * Parse current permissions for the selected record
   * so it can be used for Layman access rights component
   */
  parseCurrentPermissions(): void {
    const currentUser = this.hsCommonLaymanService.user();
    let read: string[] = this.data.selectedRecord.access_rights.read;
    let write: string[] = this.data.selectedRecord.access_rights.write;
    if (read.includes('EVERYONE')) {
      read = read.filter((r) => r != currentUser);
    }
    if (write.includes('EVERYONE')) {
      write = write.filter((r) => r != currentUser);
    }
    this.access_rights['access_rights.read'] =
      read.length == 1 && read[0] == currentUser ? 'private' : read.join(',');
    this.access_rights['access_rights.write'] =
      write.length == 1 && write[0] == currentUser
        ? 'private'
        : write.join(',');
  }

  /**
   * Close the dialog
   */
  close(): void {
    this.hsDialogContainerService.destroy(this);
  }

  /**
   * Save permissions for selected record
   */
  async savePermissions(): Promise<void> {
    let response: PostPatchLayerResponse | any;
    this.state.set('loading');
    switch (this.data.recordType) {
      case 'layer':
        const layerDesc: UpsertLayerObject = {
          name: this.data.selectedRecord.name,
          title: this.data.selectedRecord.title,
          workspace: this.hsCommonLaymanService.user(),
          access_rights: this.access_rights,
        };
        response = await this.hsLaymanService.makeUpsertLayerRequest(
          null,
          layerDesc,
        );
        if (response?.error) {
          console.error('Error saving layer permissions', response.error);
          this.state.set('error');
          break;
        }
        this.state.set('success');
        this.data.onPermissionSaved.service[
          this.data.onPermissionSaved.method
        ]();
        break;
      case 'composition':
        await this.hsLaymanService.updateCompositionAccessRights(
          this.data.selectedRecord.name,
          this.access_rights,
        );
        if (response?.error) {
          console.error('Error saving composition permissions', response.error);
          this.state.set('error');
          break;
        }
        this.state.set('success');
        this.data.onPermissionSaved.service[
          this.data.onPermissionSaved.method
        ]();
        break;
      default:
    }
    setTimeout(() => {
      this.state.set('idle');
    }, 3500);
  }
}
