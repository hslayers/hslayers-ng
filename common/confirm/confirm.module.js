/* eslint-disable angular/no-service-method */
import confirmDialogComponent from './confirm-dialog.component';
import {HsConfirmDialog} from './confirm-dialog.service';

/**
 * Module for simple confirm dialogs
 */
angular
  .module('hs.common.confirm', [])

  .service('HsConfirmDialogService', HsConfirmDialog)

  .component('hs.confirmDialog', confirmDialogComponent);
