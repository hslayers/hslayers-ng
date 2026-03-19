import {Directive, ViewContainerRef, inject} from '@angular/core';

@Directive({
  selector: '[hsDialogHost]',
})
export class HsDialogHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}
