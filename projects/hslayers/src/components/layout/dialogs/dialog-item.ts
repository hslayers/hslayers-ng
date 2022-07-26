import {Type} from '@angular/core';

export class HsDialogItem {
  app: string;
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
  waitResult(): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
    return promise;
  }
  constructor(public component: Type<any>, public data: any, app: string) {
    this.app = app;
  }
}
