import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[hslayout]',
})
export class HsLayoutHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
