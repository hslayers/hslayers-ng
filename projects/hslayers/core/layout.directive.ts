import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[hslayout]',
  standalone: false,
})
export class HsLayoutHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
