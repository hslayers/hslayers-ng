import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[map]',
})
export class HsLayoutHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
