export class HsConfirmDialog {
  constructor($compile, HsLayoutService, $rootScope) {
    'ngInject';
    Object.assign(this, {
      $compile,
      HsLayoutService,
      $rootScope,
    });
  }

  /**
   *
   * @param {string} message Message to show user
   * @param {*} title Title of the dialog
   * @returns {Promise} Promise which returns 'yes' / 'no' as
   * an argument based on which button the user clicked
   */
  show(message, title, note = '') {
    return new Promise((resolve, reject) => {
      const scope = this.$rootScope.$new();
      Object.assign(scope, {
        title,
        message,
        note,
        callback: function (result) {
          resolve(result);
        },
      });
      const el = angular.element(
        '<hs.confirm-dialog title="title" message="message" note="note" callback="callback"></hs.confirm-dialog>'
      );
      this.HsLayoutService.contentWrapper
        .querySelector('.hs-dialog-area')
        .appendChild(el[0]);
      this.$compile(el)(scope);
    });
  }
}
