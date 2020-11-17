import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[dialog-host]',
})
export class HsDialogHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
