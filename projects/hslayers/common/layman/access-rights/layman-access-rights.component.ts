import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {lastValueFrom, map} from 'rxjs';

import {HsCommonLaymanService} from '../layman.service';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLogService} from 'hslayers-ng/shared/log';
import {LaymanUser} from '../types/layman-user.type';
import {accessRightsModel} from 'hslayers-ng/types';

enum GrantingOptions {
  PERUSER = 'per_user',
  EVERYONE = 'everyone',
}
@Component({
  selector: 'hs-layman-access-rights',
  templateUrl: './layman-access-rights.component.html',
})
export class HsCommonLaymanAccessRightsComponent implements OnInit {
  @Input() access_rights: accessRightsModel;

  @Output() access_rights_changed = new EventEmitter<accessRightsModel>();

  grantingOptions = GrantingOptions;
  currentOption: string = GrantingOptions.EVERYONE;
  allUsers: LaymanUser[] = [];
  userSearch: string;
  endpoint: HsEndpoint;
  constructor(
    private hsLanguageService: HsLanguageService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private $http: HttpClient,
    private hsLog: HsLogService,
  ) {}
  async ngOnInit(): Promise<void> {
    this.endpoint = this.hsCommonLaymanService.layman;
    const readAccess = this.access_rights['access_rights.read'].split(',');
    const writeAccess = this.access_rights['access_rights.write'].split(',');
    if (readAccess.length > 1 || writeAccess.length > 1) {
      this.currentOption = GrantingOptions.PERUSER;
      await this.getAllUsers();
      this.tickFoundUsers(readAccess, 'read');
      this.tickFoundUsers(writeAccess, 'write');
    }
  }

  /**
   * Tick found user checkboxes in UI that have access rights
   * @param users - Username list that have access rights
   * @param type - Access right type (read or write)
   */
  tickFoundUsers(users: string[], type: string): void {
    users.forEach((user) => {
      const found = this.allUsers.find((u) => u.username == user);
      if (found) {
        found[type] = true;
      }
    });
  }

  /**
   * Change access rights for everyone
   * @param type - Access rights type (access_rights.read or access_rights.write)
   * @param value - Access rights value (private or EVERYONE)
   * @param event - Checkbox change event
   */
  accessRightsChanged(type: string, value: string, event?: any): void {
    if (this.currentOption == this.grantingOptions.PERUSER) {
      this.rightsChangedPerUser(type, value, event);
    } else {
      this.access_rights[type] = value;
      if (
        this.access_rights['access_rights.read'] == 'private' &&
        this.access_rights['access_rights.write'] != 'private'
      ) {
        this.access_rights['access_rights.write'] = 'private';
      }
    }
    /**
     * Notify parent component that value has changed so it can update reactiveForm
     * model (hacky but quicker)
     */
    this.access_rights_changed.emit(this.access_rights);
  }

  /**
   * Change each user access rights individually
   * @param type - Access rights type (access_rights.read or access_rights.write)
   * @param value - Access rights value (username for user)
   * @param event - Checkbox change event
   */
  rightsChangedPerUser(type: string, value: string, event?: any): void {
    if (event.target.checked && type == 'access_rights.write') {
      this.access_rights['access_rights.read'] = this.access_rights[
        'access_rights.read'
      ].concat(',' + value);
      this.findLaymanUser(value).read = event.target.checked;
    } else if (!event.target.checked && type == 'access_rights.read') {
      this.removeUserRights('access_rights.write', value);
      this.findLaymanUser(value).write = event.target.checked;
    }
    event.target.checked
      ? (this.access_rights[type] = this.access_rights[type].concat(
          ',' + value,
        ))
      : this.removeUserRights(type, value);
  }

  /**
   * Find user by username from all Layman users
   * @param username - User username provided
   */
  findLaymanUser(username: string): LaymanUser {
    return this.allUsers.find((u) => u.username == username);
  }

  /**
   * Remove user rights by filtering username from access_rights
   * @param type - Access rights type (access_rights.read or access_rights.write)
   * @param username - User username provided
   */
  removeUserRights(type: string, username: string): void {
    this.access_rights[type] = this.access_rights[type]
      .split(',')
      .filter((u: string) => u != username)
      .join(',');
  }

  /**
   * Get a translation based on the value of the right
   * @param right - Value of the access right
   */
  getRightTranslation(right: string): string {
    if (right == 'read') {
      return this.hsLanguageService.getTranslation(
        'SAVECOMPOSITION.readAccessRights',
        undefined,
      );
    } else if (right == 'write') {
      return this.hsLanguageService.getTranslation(
        'SAVECOMPOSITION.writeAccessRights',
        undefined,
      );
    }
  }

  /**
   * Change access granting options (everyone or per_user)
   * @param option - Access granting option
   */
  async changeGrantingOptions(option: 'per_user' | 'everyone'): Promise<void> {
    if (option == this.grantingOptions.PERUSER) {
      await this.getAllUsers();
      this.access_rights['access_rights.read'] = this.endpoint.user;
      this.access_rights['access_rights.write'] = this.endpoint.user;
    } else {
      this.allUsers = [];
      this.access_rights['access_rights.read'] = 'EVERYONE';
      this.access_rights['access_rights.write'] = 'private';
    }
    this.currentOption = option;
  }

  /**
   * Get all registered users from Layman's endpoint service
   */
  async getAllUsers(): Promise<void> {
    if (this.endpoint?.authenticated) {
      const url = `${this.endpoint.url}/rest/users`;
      try {
        this.allUsers = await lastValueFrom(
          this.$http.get<LaymanUser[]>(url, {withCredentials: true}).pipe(
            map((res: any[]) => {
              return res
                .filter((user) => user.username != this.endpoint.user)
                .map((user) => {
                  const laymanUser: LaymanUser = {
                    username: user.username,
                    screenName: user.screen_name,
                    givenName: user.given_name,
                    familyName: user.family_name,
                    middleName: user.middle_name,
                    name: user.name,
                  };
                  laymanUser.hslDisplayName = this.getUserName(laymanUser);
                  return laymanUser;
                });
            }),
          ),
        );
      } catch (e) {
        this.hsLog.error(e);
      }
    }
  }

  /**
   * Filter users by name
   * This function is passed as filter pipe function
   */
  userFilter = (item: LaymanUser): boolean => {
    const r = new RegExp(this.userSearch, 'i');
    return (
      r.test(item.givenName) ||
      r.test(item.familyName) ||
      r.test(item.screenName)
    );
  };

  /**
   * Refresh user list, when searching for specific user
   */
  refreshList(): void {
    this.allUsers = Array.from(this.allUsers);
  }

  /**
   * Refresh user list, when searching for specific user
   * @param user - Provided Layman's service user
   */
  getUserName(user: any): string {
    if (user.givenName && user.familyName) {
      return user.givenName + ' ' + user.familyName;
    } else if (user.screenName) {
      return user.screenName;
    } else {
      return user.username;
    }
  }
}
