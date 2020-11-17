import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[panel-host]',
})
export class HsPanelHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
