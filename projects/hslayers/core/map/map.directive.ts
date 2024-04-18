import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[map]',
  standalone: true,
})
export class HsMapDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
