import {Directive, ViewContainerRef} from '@angular/core';
@Directive({
  selector: '[hsMapHost]',
  standalone: false,
})
export class HsMapHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
