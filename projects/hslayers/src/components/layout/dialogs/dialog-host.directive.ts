import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[hsDialogHost]',
})
export class HsDialogHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
