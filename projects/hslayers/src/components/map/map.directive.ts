import {Directive, Input, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[map]',
})
export class HsMapDirective {
  @Input() app = 'default';
  constructor(public viewContainerRef: ViewContainerRef) {}
}
