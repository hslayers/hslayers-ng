import {CommonModule} from '@angular/common';
import {Component, OnInit, ViewRef} from '@angular/core';

import {AccessRightsModel, HsAddDataLayerDescriptor} from 'hslayers-ng/types';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {
  HsDialogComponent,
  HsDialogContainerService,
  HsDialogItem,
} from 'hslayers-ng/common/dialogs';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsLaymanModule} from 'hslayers-ng/common/layman';
import {HsLaymanService} from 'hslayers-ng/services/save-map';
import {PostPatchLayerResponse} from 'hslayers-ng/common/layman';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';
import {UpsertLayerObject} from 'hslayers-ng/types';

@Component({
  selector: 'hs-set-permissions-dialog',
  templateUrl: './set-permissions.component.html',
  standalone: true,
  imports: [CommonModule, TranslateCustomPipe, HsLaymanModule],
})
export class HsSetPermissionsDialogComponent
  implements HsDialogComponent, OnInit
{
  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  currentAccessRights: AccessRightsModel = {
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
    selectedRecord: HsAddDataLayerDescriptor;
    onPermissionSaved: {
      service: any;
      method: string;
    };
  };
  endpoint: HsEndpoint;
  state: 'idle' | 'loading' | 'success' | 'error' = 'idle';

  constructor(
    public hsCommonLaymanService: HsCommonLaymanService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLaymanService: HsLaymanService,
  ) {}

  ngOnInit(): void {
    // Can set permission for Layman endpoint only
    this.endpoint = this.hsCommonLaymanService.layman;
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
    const currentUser = this.endpoint.user;
    let read: string[] = this.data.selectedRecord.access_rights.read;
    let write: string[] = this.data.selectedRecord.access_rights.write;
    if (read.includes('EVERYONE')) {
      read = read.filter((r) => r != currentUser);
    }
    if (write.includes('EVERYONE')) {
      write = write.filter((r) => r != currentUser);
    }
    this.currentAccessRights['access_rights.read'] =
      read.length == 1 && read[0] == currentUser ? 'private' : read.join(',');
    this.currentAccessRights['access_rights.write'] =
      write.length == 1 && write[0] == currentUser
        ? 'private'
        : write.join(',');
  }

  /**
   * @public
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
    this.state = 'loading';
    switch (this.data.recordType) {
      case 'layer':
        const layerDesc: UpsertLayerObject = {
          name: this.data.selectedRecord.name,
          title: this.data.selectedRecord.title,
          workspace: this.endpoint.user,
          access_rights: this.currentAccessRights,
        };
        response = await this.hsLaymanService.makeUpsertLayerRequest(
          this.endpoint,
          null,
          layerDesc,
        );
        if (response?.error) {
          this.state = 'error';
          return;
        }
        this.state = 'success';
        this.data.onPermissionSaved.service[
          this.data.onPermissionSaved.method
        ]();
        break;
      case 'composition':
        await this.hsLaymanService.updateCompositionAccessRights(
          this.data.selectedRecord.name,
          this.endpoint,
          this.currentAccessRights,
        );
        if (response?.error) {
          this.state = 'error';
          return;
        }
        this.state = 'success';
        this.data.onPermissionSaved.service[
          this.data.onPermissionSaved.method
        ]();
        break;
      default:
    }
    setTimeout(() => {
      this.state = 'idle';
    }, 3500);
  }
}
