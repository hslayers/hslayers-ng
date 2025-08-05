import {Component, computed, inject, signal} from '@angular/core';
import {AsyncPipe} from '@angular/common';

import {map} from 'rxjs';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslatePipe} from '@ngx-translate/core';

import {HsCommonLaymanService} from './layman.service';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsConfig} from 'hslayers-ng/config';
import {HsToastService} from 'hslayers-ng/common/toast';

@Component({
  selector: 'hs-layman-current-user',
  templateUrl: './layman-current-user.component.html',
  imports: [AsyncPipe, TranslatePipe, NgbDropdownModule],
  styles: `
    .user-auth-container {
      .user-dropdown {
        .user-avatar {
          width: 1.75rem;
          height: 1.75rem;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
        }

        .user-dropdown-menu {
          min-width: 15rem;
          border-radius: 0.5rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);

          .user-header {
            border-radius: 0.5rem 0.5rem 0 0;

            .user-avatar-large {
              width: 3rem;
              height: 3rem;
              background-color: #e9ecef;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.25rem;
            }
          }

          button.dropdown-item {
            border-radius: 0.25rem;
            margin: 0.125rem 0;

            &:hover {
              background-color: #f8f9fa;
            }

            &.text-danger:hover {
              background-color: #fff5f5;
            }
          }
        }
      }
    }
  `,
})
export class HsLaymanCurrentUserComponent {
  hsCommonLaymanService = inject(HsCommonLaymanService);
  HsDialogContainerService = inject(HsDialogContainerService);
  hsConfig = inject(HsConfig);
  hsToastService = inject(HsToastService);

  dropdownOpen = signal(false);

  sameDomain = computed(() => {
    const laymanEndpoint = this.hsCommonLaymanService.layman();
    if (!laymanEndpoint) {
      return false;
    }
    return laymanEndpoint.url.includes(window.location.origin);
  });

  inAppLogin = this.hsCommonLaymanService.layman$.pipe(
    map((layman) => layman?.type === 'layman'),
  );

  /**
   * Log out the current user
   */
  logout(): void {
    this.hsCommonLaymanService.logout();
  }

  /**
   * Open login dialog or redirect to login page
   */
  async login(): Promise<void> {
    this.hsCommonLaymanService.login$.next();
    const authUrl = this.hsCommonLaymanService.layman()?.url + '/login';
    if (!this.sameDomain()) {
      window.open(authUrl, 'AuthWindow');
      return;
    }

    // For same-domain logins, open the dialog
    const {HsLaymanLoginComponent} = await import('./layman-login.component');
    this.HsDialogContainerService.create(HsLaymanLoginComponent, {
      url: authUrl,
    });
  }
}
