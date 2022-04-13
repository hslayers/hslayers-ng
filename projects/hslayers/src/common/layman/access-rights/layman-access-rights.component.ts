import {Component, Input} from '@angular/core';
import {HttpClient} from '@angular/common/http';

import {lastValueFrom, map} from 'rxjs';

import {HsEndpoint} from '../../endpoints/endpoint.interface';
import {HsLanguageService} from '../../../components/language/language.service';
import {HsLaymanService} from '../../../components/save-map/layman.service';
import {HsLogService} from './../../log/log.service';
import {accessRightsModel} from '../../../components/add-data/common/access-rights.model';

type LaymanUser = {
  username: string; // Username of the user.
  screenName: string; // Screen name of the user.
  givenName: string; // Given name of the user.
  familyName: string; // Family name of the user
  middleName: string; // Middle name of the user
  name: string; // Whole name of the user (given_name + middle_name + family_name).
  read?: boolean;
  write?: boolean;
};
enum GrantingOptions {
  PERUSER = 'per_user',
  EVERYONE = 'everyone',
}
@Component({
  selector: 'hs-layman-access-rights',
  templateUrl: './layman-access-rights.html',
})
export class HsCommonLaymanAccessRightsComponent {
  @Input() access_rights: accessRightsModel;
  @Input() app = 'default';
  grantingOptions = GrantingOptions;
  currentOption: string = GrantingOptions.EVERYONE;
  allUsers: LaymanUser[] = [];
  userSearch: string;
  constructor(
    private hsLanguageService: HsLanguageService,
    private hsLaymanService: HsLaymanService,
    private $http: HttpClient,
    private hsLog: HsLogService
  ) {}

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
  }

  /**
   * Change each user access rights individually
   * @param type - Access rights type (access_rights.read or access_rights.write)
   * @param value - Access rights value (username for user)
   * @param event - Checkbox change event
   */
  rightsChangedPerUser(type: string, value: string, event?: any): void {
    if (event.target.checked && type == 'access_rights.write') {
      (this.access_rights['access_rights.read'] as string[]).push(value);
      this.findLaymanUser(value).read = event.target.checked;
    } else if (!event.target.checked && type == 'access_rights.read') {
      this.removeUserRights('access_rights.write', value);
      this.findLaymanUser(value).write = event.target.checked;
    }
    event.target.checked
      ? this.access_rights[type].push(value)
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
    this.access_rights[type] = this.access_rights[type].filter(
      (u: string) => u != username
    );
  }

  /**
   * Get a translation based on the value of the right
   * @param right - Value of the access right
   */
  getRightTranslation(right: string): string {
    if (right == 'read') {
      return this.hsLanguageService.getTranslation(
        'SAVECOMPOSITION.readAccessRights',
        this.app
      );
    } else if (right == 'write') {
      return this.hsLanguageService.getTranslation(
        'SAVECOMPOSITION.writeAccessRights',
        this.app
      );
    }
  }

  /**
   * Change access granting options (everyone or per_user)
   * @param option - Access granting option
   */
  changeGrantingOptions(option: 'per_user' | 'everyone'): void {
    if (option == this.grantingOptions.PERUSER) {
      this.getAllUsers();
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
    const endpoint: HsEndpoint = this.hsLaymanService.getLaymanEndpoint();
    if (endpoint?.authenticated) {
      const url = `${endpoint.url}/rest/users`;
      try {
        this.allUsers = await lastValueFrom(
          this.$http.get<LaymanUser[]>(url, {withCredentials: true}).pipe(
            map((res: any[]) => {
              return res
                .filter((user) => user.username != endpoint.user)
                .map((user) => {
                  return {
                    username: user.username,
                    screenName: user.screen_name,
                    givenName: user.given_name,
                    familyName: user.family_name,
                    middleName: user.middle_name,
                    name: user.name,
                  };
                });
            })
          )
        );
        this.access_rights['access_rights.read'] = [endpoint.user];
        this.access_rights['access_rights.write'] = [endpoint.user];
      } catch (e) {
        this.hsLog.error(e);
      }
    }
  }

  /**
   * Filter users by name
   * This function is passed as filter pipe function
   */
  userFilter = (item): boolean => {
    const r = new RegExp(this.userSearch, 'i');
    return r.test(item.name);
  };

  /**
   * Refresh user list, when searching for specific user
   */
  refreshList(): void {
    this.allUsers = Array.from(this.allUsers);
  }
}
