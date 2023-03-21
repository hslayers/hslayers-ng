import {Component, OnInit, ViewRef} from '@angular/core';

import {HsAddDataCatalogueService} from '../../../components/add-data/catalogue/catalogue.service';
import {HsAddDataLayerDescriptor} from '../../../components/add-data/catalogue/layer-descriptor.model';
import {HsCommonLaymanService} from '../layman.service';
import {HsCompositionsCatalogueService} from '../../../components/compositions/compositions-catalogue.service';
import {HsDialogComponent} from '../../../components/layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../../components/layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../../../components/layout/dialogs/dialog-item';
import {HsEndpoint} from '../../endpoints/endpoint.interface';
import {HsLaymanService} from '../../../components/save-map/layman.service';
import {PostPatchLayerResponse} from '../types/post-patch-layer-response.type';
import {UpsertLayerObject} from '../../../components/save-map/types/upsert-layer-object.type';
import {accessRightsModel} from '../../../components/add-data/common/access-rights.model';

@Component({
  selector: 'hs-set-permissions-dialog',
  templateUrl: './set-permissions.component.html',
})
export class HsSetPermissionsDialogComponent
  implements HsDialogComponent, OnInit {
  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  currentAccessRights: accessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  data: {
    recordType: string;
    selectedRecord: HsAddDataLayerDescriptor;
  };
  endpoint: HsEndpoint;

  constructor(
    public hsCommonLaymanService: HsCommonLaymanService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLaymanService: HsLaymanService,
    private hsAddDataCatalogueService: HsAddDataCatalogueService,
    private hsCompositionsCatalogueService: HsCompositionsCatalogueService
  ) {}

  ngOnInit(): void {
    //Can set permision for layman endpoint only
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
          layerDesc
        );
        if (response?.error) {
          return;
        }
        this.hsAddDataCatalogueService.reloadData();
        this.close();
        break;
      case 'composition':
        response = await this.hsLaymanService.updateCompositionAccessRights(
          this.data.selectedRecord.name,
          this.endpoint,
          this.currentAccessRights
        );
        if (response?.error) {
          return;
        }
        this.hsCompositionsCatalogueService.loadFilteredCompositions();
        this.close();
        break;
      default:
    }
  }
}
