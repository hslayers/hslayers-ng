import {Directive, ViewContainerRef, inject} from '@angular/core';
@Directive({selector: '[hsMapHost]'})
export class HsMapHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}
