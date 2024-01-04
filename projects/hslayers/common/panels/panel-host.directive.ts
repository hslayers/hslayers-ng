import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[hsPanelHost]',
})
export class HsPanelHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
