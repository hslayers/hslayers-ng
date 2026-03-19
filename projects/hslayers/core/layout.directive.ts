import {Directive, ViewContainerRef, inject} from '@angular/core';

@Directive({selector: '[hsLayout]'})
export class HsLayoutHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}
