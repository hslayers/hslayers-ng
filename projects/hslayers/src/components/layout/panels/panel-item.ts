import {Type} from '@angular/core';

export class HsPanelItem {
  constructor(
    public component: Type<any>,
    public data: any,
  ) {}
}
