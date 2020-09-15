import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[map]',
})
export class HsMapHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
