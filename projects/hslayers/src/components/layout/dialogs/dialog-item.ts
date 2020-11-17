import {Type} from '@angular/core';

export class HsDialogItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
  waitResult(): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    return promise;
  }
  constructor(public component: Type<any>, public data: any) {}
}

/*
Copyright Google LLC. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/
