import {Directive, ViewContainerRef} from '@angular/core';
@Directive({
  selector: '[hsMapHost]',
})
export class HsMapHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
