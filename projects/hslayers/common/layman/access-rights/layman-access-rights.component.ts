import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, lastValueFrom, map, of, switchMap} from 'rxjs';

import {AccessRightsModel} from 'hslayers-ng/types';
import {HsCommonLaymanService} from '../layman.service';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsLogService} from 'hslayers-ng/services/log';
import {LaymanUser} from '../types/layman-user.type';

enum GrantingOptions {
  PERUSER = 'perUser',
  EVERYONE = 'everyone',
  PERROLE = 'perRole',
}

enum AccessRights {
  READ = 'access_rights.read',
  WRITE = 'access_rights.write',
}

export type AccessRightsType = 'read' | 'write';

@Component({
  selector: 'hs-layman-access-rights',
  templateUrl: './layman-access-rights.component.html',
})
export class HsCommonLaymanAccessRightsComponent implements OnInit {
  @Input() access_rights: AccessRightsModel;
  defaultAccessRights: AccessRightsModel;
  @Input() collapsed: boolean = false;

  @Output() access_rights_changed = new EventEmitter<AccessRightsModel>();

  grantingOptions: GrantingOptions[] = [
    GrantingOptions.EVERYONE,
    GrantingOptions.PERUSER,
    GrantingOptions.PERROLE,
  ];
  currentOption: string = GrantingOptions.EVERYONE;
  rightsOptions: AccessRightsType[] = ['read', 'write'];

  allUsers: LaymanUser[] = [];
  userSearch: string;
  endpoint: HsEndpoint;
  constructor(
    private hsCommonLaymanService: HsCommonLaymanService,
    private $http: HttpClient,
    private hsLog: HsLogService,
  ) {}
  async ngOnInit(): Promise<void> {
    this.endpoint = this.hsCommonLaymanService.layman;
    /**
     * Access rights per role can be assigned only when connected with Wagtail CMS
     */
    if (!this.endpoint.type.includes('wagtail')) {
      this.grantingOptions.pop();
    }
    this.defaultAccessRights = JSON.parse(JSON.stringify(this.access_rights));
    const readAccess = this.access_rights[AccessRights.READ].split(',');
    const writeAccess = this.access_rights[AccessRights.WRITE].split(',');
    if (readAccess.length > 1 || writeAccess.length > 1) {
      this.currentOption = GrantingOptions.PERUSER;
      await this.getAllUsers();
    }
  }

  /**
   * Toggles access rights for all users
   * @param users - Username list that have access rights
   * @param type - Access right type (read or write)
   */
  toggleRightsForAllUsers(type: AccessRightsType): void {
    /**
     * Value to be set.
     * Negative of value of bigger part of the users
     */
    const value =
      this.allUsers.length / 2 >= this.allUsers.filter((u) => u[type]).length;

    this.allUsers.forEach((user) => {
      const isCurrentUser = user.username === this.endpoint.user;
      //Value for current user cannot be wont be changed
      user[type] = isCurrentUser ? user[type] : value;
      //In case write permission is being added make sure read is granted as well
      //when read perrmission is being taken away, make sure write is taken as well
      if ((type === 'write' && value) || (type === 'read' && !value)) {
        const t = type === 'write' ? 'read' : 'write';
        user[t] = isCurrentUser ? user[t] : value;
        this.access_rights[`access_rights.${t}`] = value
          ? 'EVERYONE'
          : 'private';
      }
    });
    //Update access_rights model
    this.access_rights[`access_rights.${type}`] = value
      ? 'EVERYONE'
      : 'private';
    this.access_rights_changed.emit(this.access_rights);
  }

  /**
   * Change access rights for everyone
   * @param type - Access rights type (access_rights.read or access_rights.write)
   * @param value - Access rights value (private or EVERYONE)
   * @param event - Checkbox change event
   */
  accessRightsChanged(
    type: AccessRightsType,
    value: string,
    event?: any,
  ): void {
    if (this.currentOption == GrantingOptions.PERUSER) {
      this.rightsChangedPerUser(type, value, event);
    } else {
      this.access_rights[`access_rights.${type}`] = value;
      if (
        this.access_rights[AccessRights.READ] == 'private' &&
        this.access_rights[AccessRights.WRITE] != 'private'
      ) {
        this.access_rights[AccessRights.WRITE] = 'private';
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
  rightsChangedPerUser(
    type: AccessRightsType,
    username: LaymanUser['username'],
    event?: any,
  ): void {
    const value = event.target.checked;
    const user = this.findLaymanUser(username);
    if ((type === 'write' && value) || (type === 'read' && !value)) {
      const t = type === 'write' ? 'read' : 'write';
      user[t] = value;
      this.setAcessRightsFromUsers(t);
    }
    this.setAcessRightsFromUsers(type);
  }

  /**
   * Based on [type] property of users update access_rights value
   */
  setAcessRightsFromUsers(type: AccessRightsType): void {
    this.access_rights[`access_rights.${type}`] = this.allUsers
      .reduce((acc, curr) => {
        if (curr[type]) {
          acc.push(curr.username);
        }
        return acc;
      }, [] as string[])
      .join(',');
    this.access_rights_changed.emit(this.access_rights);
  }

  /**
   * Find user by username from all Layman users
   * @param username - User username provided
   */
  findLaymanUser(username: string): LaymanUser {
    return this.allUsers.find((u) => u.username == username);
  }

  /**
   * Change access granting options (everyone or perUser)
   * @param option - Access granting option
   */
  async changeGrantingOptions(option: GrantingOptions): Promise<void> {
    if (option == GrantingOptions.PERUSER) {
      await this.getAllUsers();
    } else {
      //In case some users has access rights use EVERYONE, private otherwise
      //READ
      const rights = this.allUsers.reduce(
        (acc, curr) => {
          acc.read += curr['read'] ? 1 : 0;
          acc.write += curr['write'] ? 1 : 0;
          return acc;
        },
        {read: 0, write: 0},
      );
      this.access_rights[AccessRights.READ] =
        rights.read > 1 ? 'EVERYONE' : 'private';

      this.access_rights[AccessRights.WRITE] =
        rights.write > 1 ? 'EVERYONE' : 'private';
    }
    this.currentOption = option;
  }

  /**
   * Check whether user has access rights.
   */
  userHasAccess(user: string, rights: string[]): boolean {
    return rights.includes(user) || rights.includes('EVERYONE');
  }

  /**
   * Get all registered users from Layman's endpoint service
   */
  async getAllUsers(access_rights?: AccessRightsModel): Promise<void> {
    if (this.endpoint?.authenticated) {
      const url = `${this.endpoint.url}/rest/users`;

      access_rights ??= this.access_rights;
      const read = access_rights[AccessRights.READ].split(',');
      const write = access_rights[AccessRights.WRITE].split(',');

      try {
        this.allUsers = await lastValueFrom(
          of(this.allUsers).pipe(
            switchMap((users) =>
              users.length === 0
                ? this.$http
                    .get<LaymanUser[]>(url, {withCredentials: true})
                    .pipe(
                      catchError((error) => {
                        console.warn('Could not get users list', error);
                        return of([]);
                      }),
                    )
                : of(users),
            ),
            map((res: LaymanUser[]) => {
              return res.map((user) => {
                const isCurrentUser = user.username === this.endpoint.user;
                const laymanUser: LaymanUser = {
                  ...user,
                  read:
                    isCurrentUser || this.userHasAccess(user.username, read),
                  write:
                    isCurrentUser || this.userHasAccess(user.username, write),
                };
                laymanUser.hslDisplayName ??= this.getUserName(laymanUser);
                return laymanUser;
              });
            }),
          ),
        );
        this.setAcessRightsFromUsers('read');
        this.setAcessRightsFromUsers('write');
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
      r.test(item.given_name) ||
      r.test(item.family_name) ||
      r.test(item.screen_name)
    );
  };

  /**
   * Refresh user list, when searching for specific user
   */
  refreshList(): void {
    this.allUsers = Array.from(this.allUsers);
  }

  /**
   * Reset to the state before user manipulation
   */
  resetToDefault(): void {
    //Reassing default access rights
    this.access_rights[AccessRights.READ] =
      this.defaultAccessRights[AccessRights.READ];
    this.access_rights[AccessRights.WRITE] =
      this.defaultAccessRights[AccessRights.WRITE];

    this.currentOption = GrantingOptions.EVERYONE;
    const read = this.defaultAccessRights[AccessRights.READ].split(',');
    const write = this.defaultAccessRights[AccessRights.WRITE].split(',');

    //username to alias (EVERYONE,private) mappings
    this.access_rights[AccessRights.READ] =
      read.length == 1 && read[0] == this.endpoint.user
        ? 'private'
        : this.access_rights[AccessRights.READ];
    this.access_rights[AccessRights.WRITE] =
      write.length == 1 && write[0] == this.endpoint.user
        ? 'private'
        : this.access_rights[AccessRights.WRITE];

    //Switch to user view if more entries exist
    if (read.length > 1 || write.length > 1) {
      this.currentOption = GrantingOptions.PERUSER;
      this.getAllUsers();
    }
    this.access_rights_changed.emit(this.access_rights);
  }

  /**
   * Refresh user list, when searching for specific user
   * @param user - Provided Layman's service user
   */
  getUserName(user: any): string {
    if (user.given_name && user.family_name) {
      return user.given_name + ' ' + user.family_name;
    } else if (user.screen_name) {
      return user.screen_name;
    } else {
      return user.username;
    }
  }
}
