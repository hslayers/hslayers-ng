import {Component, Input, ViewRef} from '@angular/core';
import {accessRightsModel} from '../../../components/add-data/common/access-rights.model';

@Component({
  selector: 'hs-layman-access-rights',
  templateUrl: './layman-access-rights.html',
})
export class HsCommonLaymanAccessRightsComponent {
  @Input() access_rights: accessRightsModel;
  constructor() {}

  accessRightChanged(
    access_rights: accessRightsModel,
    type: string,
    value: string
  ): accessRightsModel {
    access_rights[type] = value;
    if (
      access_rights['access_rights.read'] == 'private' &&
      access_rights['access_rights.write'] != 'private'
    ) {
      access_rights['access_rights.write'] = 'private';
    }
    return access_rights;
  }
}
