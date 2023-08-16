import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[map]',
})
export class HsMapDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
