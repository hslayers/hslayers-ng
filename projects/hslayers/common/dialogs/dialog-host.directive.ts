import {Directive, ViewContainerRef, inject} from '@angular/core';

@Directive({
  selector: '[hsDialogHost]',
  standalone: true,
})
export class HsDialogHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}
