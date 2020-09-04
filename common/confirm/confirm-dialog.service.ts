import {HsLayoutService} from '../../components/layout/layout.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HsConfirmDialogService {
  constructor(private HsLayoutService: HsLayoutService) {}

  /**
   *
   * @param {string} message Message to show user
   * @param {*} title Title of the dialog
   * @returns {Promise} Promise which returns 'yes' / 'no' as
   * an argument based on which button the user clicked
   */
  show(message, title) {
    //TODO: solve this mess
    /*    return new Promise((resolve, reject) => {
      const scope = this.$rootScope.$new();
      Object.assign(scope, {
        title,
        message,
        callback: function (result) {
          resolve(result);
        },
      });
      const el = angular.element(
        '<hs.confirm-dialog title="title" message="message" callback="callback"></hs.confirm-dialog>'
      );
      this.HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);
      this.$compile(el)(scope);
    }); */
  }
}
