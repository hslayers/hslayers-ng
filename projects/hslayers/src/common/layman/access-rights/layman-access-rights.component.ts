import {Component, Input, ViewRef} from '@angular/core';
import {accessRightsInterface} from '../../../components/add-data/common/access-rights.interface';

@Component({
  selector: 'hs-layman-access-rights',
  templateUrl: './layman-access-rights.html',
})
export class HsCommonLaymanAccessRightsComponent {
  @Input() access_rights: accessRightsInterface;
  constructor() {}

  accessRightChanged(
    access_rights: accessRightsInterface,
    type: string,
    value: string
  ): accessRightsInterface {
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
