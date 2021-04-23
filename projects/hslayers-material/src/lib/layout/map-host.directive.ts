import {Directive, ViewContainerRef} from '@angular/core';
@Directive({
  selector: '[map-host]',
})
export class HsMapHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
