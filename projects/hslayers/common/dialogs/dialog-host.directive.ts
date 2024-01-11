import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[hsDialogHost]',
  standalone: true,
})
export class HsDialogHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
