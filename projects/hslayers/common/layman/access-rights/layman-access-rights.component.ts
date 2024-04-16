import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, catchError, lastValueFrom, map, of, switchMap} from 'rxjs';

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

type AcessRightsActor = GrantingOptions.PERROLE | GrantingOptions.PERUSER;

type LaymanRole = {
  name: string;
  read: boolean;
  write: boolean;
};

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
  allRoles: LaymanRole[] = [];

  userSearch: string;
  endpoint: HsEndpoint;
  constructor(
    private hsCommonLaymanService: HsCommonLaymanService,
    private $http: HttpClient,
    private hsLog: HsLogService,
  ) {}
  async ngOnInit(): Promise<void> {
    this.endpoint = this.hsCommonLaymanService.layman;
    this.defaultAccessRights = JSON.parse(JSON.stringify(this.access_rights));
    this.setUpAccessRights();
  }

  /**
   * Sets up acccess rights based on access_rights input or reset to defaultAccessRights
   */
  setUpAccessRights() {
    this.currentOption = GrantingOptions.EVERYONE;
    const readAccess = this.access_rights[AccessRights.READ].split(',');
    const writeAccess = this.access_rights[AccessRights.WRITE].split(',');
    /** Bigger than 1 because of current user + others/role */
    if (readAccess.length > 1 || writeAccess.length > 1) {
      //Uppercase entry = role permissions
      this.currentOption = [...readAccess, ...writeAccess].find(
        (item) => item === item.toUpperCase(),
      )
        ? GrantingOptions.PERROLE
        : GrantingOptions.PERUSER;
      this.currentOption === GrantingOptions.PERUSER
        ? this.getAllUsers()
        : this.getRoles();
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
      const isCurrentUser = user.name === this.endpoint.user;
      //Value for current user be wont be changed
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
   * @param value - Access rights value (private, EVERYONE, users name or user role)
   * @param event - Checkbox change event
   */
  accessRightsChanged(
    type: AccessRightsType,
    value: string,
    event?: any,
  ): void {
    if (this.currentOption == GrantingOptions.PERUSER) {
      this.rightsChangedPerActor(type, value, GrantingOptions.PERUSER, event);
    } else if (this.currentOption == GrantingOptions.PERROLE) {
      this.rightsChangedPerActor(type, value, GrantingOptions.PERROLE, event);
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
  rightsChangedPerActor(
    type: AccessRightsType,
    name: LaymanUser['name'] | LaymanRole['name'],
    actor: AcessRightsActor,
    event?: any,
  ): void {
    const value = event.target.checked;
    const user = this.findLaymanActor(name, actor);
    if ((type === 'write' && value) || (type === 'read' && !value)) {
      const t = type === 'write' ? 'read' : 'write';
      user[t] = value;
      this.setAcessRightsFromActor(t, actor);
    }
    this.setAcessRightsFromActor(type, actor);
  }

  /**
   * Based on [type] property of users/roles update access_rights value
   */
  setAcessRightsFromActor(
    type: AccessRightsType,
    actor: AcessRightsActor,
  ): void {
    const source =
      actor === GrantingOptions.PERUSER
        ? this.allUsers
        : [
            ...this.allRoles,
            //Add current user as he has got to retain both read and write rights
            {name: this.endpoint.user, read: true, write: true},
          ];
    this.access_rights[`access_rights.${type}`] = source
      .reduce((acc, curr) => {
        if (curr[type]) {
          acc.push(curr['name']);
        }
        return acc;
      }, [] as string[])
      .join(',');
    this.access_rights_changed.emit(this.access_rights);
  }

  /**
   * Find user by name from all Layman users
   * @param name - User name provided
   */
  findLaymanActor<T extends GrantingOptions>(
    name: string,
    actor: T,
  ): T extends GrantingOptions.PERUSER ? LaymanUser : LaymanRole {
    const source =
      actor === GrantingOptions.PERUSER ? this.allUsers : this.allRoles;
    return source.find(
      (u: any) => u.name === name,
    ) as T extends GrantingOptions.PERUSER ? LaymanUser : LaymanRole;
  }

  /**
   * Change access granting options (everyone or perUser)
   * @param option - Access granting option
   */
  async changeGrantingOptions(option: GrantingOptions): Promise<void> {
    if (option == GrantingOptions.PERUSER) {
      await this.getAllUsers();
    } else if (option == GrantingOptions.PERROLE) {
      await this.getRoles();
    } else {
      //In case some users/roles has access rights use EVERYONE, private otherwise
      //READ
      const actor =
        this.currentOption == GrantingOptions.PERROLE
          ? this.allRoles
          : this.allUsers;
      const rights = actor.reduce(
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
   * Determine whether the role has an acces or not
   */
  roleHasAccess(
    role: string,
    rights: string[],
    type: AccessRightsType,
  ): boolean {
    //Switching from users table
    if (this.currentOption === GrantingOptions.PERUSER) {
      //Users with the role
      const usersWithRole = this.allUsers.filter((u) => u.role === role);
      //Users of that role with access
      const usersWithRoleAndAccess = usersWithRole.filter((u) => u[type]);
      return (
        //True in case more than half of the users from the role has access
        (usersWithRoleAndAccess.length !== 0 &&
          usersWithRoleAndAccess.length >= usersWithRole.length / 2) ||
        //Or all users has access
        this.allUsers.filter((u) => u[type]).length === this.allUsers.length
      );
    }
    //Switching from 'everyone' tab or opening role tab first
    return rights.includes(role) || rights.includes('EVERYONE');
  }

  /**
   * Get user roles
   */
  async getRoles(access_rights?: AccessRightsModel): Promise<void> {
    if (this.endpoint?.authenticated) {
      const url = `${this.endpoint.url}/rest/roles`;

      access_rights ??= this.access_rights;
      const read = access_rights[AccessRights.READ].split(',');
      const write = access_rights[AccessRights.WRITE].split(',');

      this.allRoles = await lastValueFrom(
        of(this.allRoles).pipe(
          switchMap((roles) =>
            roles.length === 0
              ? this.$http.get<string[]>(url, {withCredentials: true}).pipe(
                  catchError((error) => {
                    console.warn('Could not get roles  list', error);
                    return of([]);
                  }),
                )
              : of(roles.map((r) => r.name)),
          ),
          map((roles: string[]) => {
            return roles
              .filter((r) => r !== 'EVERYONE')
              .map((r) => {
                return {
                  name: r,
                  read: this.roleHasAccess(r, read, 'read'),
                  write: this.roleHasAccess(r, write, 'write'),
                };
              });
          }),
        ),
      );
      this.setAcessRightsFromActor('read', GrantingOptions.PERROLE);
      this.setAcessRightsFromActor('write', GrantingOptions.PERROLE);
    }
  }

  /**
   * Get users from Layman or Wagtail depnding on endpoin type.
   * Main difference is that Wagtail response includes user roles
   */
  private fetchUsers(): Observable<LaymanUser[]> {
    const url = this.endpoint.type.includes('wagtail')
      ? '/get-users'
      : `${this.endpoint.url}/rest/users`;
    return this.$http.get<LaymanUser[]>(url, {withCredentials: true}).pipe(
      catchError((error) => {
        console.warn('Could not get users list', error);
        return of([]);
      }),
    );
  }

  /**
   * Check whether user has access rights.
   * actor meaning user or role
   */
  userHasAccess(
    user: LaymanUser,
    rights: string[],
    type: AccessRightsType,
  ): boolean {
    if (this.currentOption === GrantingOptions.PERROLE) {
      return this.allRoles.every((r) => r[type]) || rights.includes(user.role);
    }
    return rights.includes(user.name) || rights.includes('EVERYONE');
  }

  /**
   * Get all registered users from Layman's endpoint service
   */
  async getAllUsers(access_rights?: AccessRightsModel): Promise<void> {
    if (this.endpoint?.authenticated) {
      access_rights ??= this.access_rights;
      const read = access_rights[AccessRights.READ].split(',');
      const write = access_rights[AccessRights.WRITE].split(',');

      try {
        this.allUsers = await lastValueFrom(
          of(this.allUsers).pipe(
            switchMap((users) =>
              users.length === 0 ? this.fetchUsers() : of(users),
            ),
            map((res: LaymanUser[]) => {
              return res.map((user) => {
                const isCurrentUser = user.username === this.endpoint.user;
                const laymanUser: LaymanUser = {
                  ...user,
                  name: user.username,
                  role: user.username.length > 5 ? 'MODERATORS' : 'EDITORS',
                };
                //Assign rights after obj initiation to have acess to mocked role
                laymanUser.read =
                  isCurrentUser || this.userHasAccess(laymanUser, read, 'read');
                laymanUser.write =
                  isCurrentUser ||
                  this.userHasAccess(laymanUser, write, 'write');
                laymanUser.hslDisplayName ??= this.getDisplayName(laymanUser);
                return laymanUser;
              });
            }),
          ),
        );
        this.setAcessRightsFromActor('read', GrantingOptions.PERUSER);
        this.setAcessRightsFromActor('write', GrantingOptions.PERUSER);
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
  async resetToDefault(): Promise<void> {
    //Reassing default access rights
    this.access_rights[AccessRights.READ] =
      this.defaultAccessRights[AccessRights.READ];
    this.access_rights[AccessRights.WRITE] =
      this.defaultAccessRights[AccessRights.WRITE];

    this.setUpAccessRights();
  }

  /**
   * Refresh user list, when searching for specific user
   * @param user - Provided Layman's service user
   */
  getDisplayName(user: any): string {
    if (user.given_name && user.family_name) {
      return user.given_name + ' ' + user.family_name;
    } else if (user.screen_name) {
      return user.screen_name;
    } else {
      return user.username;
    }
  }
}
