import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[hsPanelHost]',
  standalone: false,
})
export class HsPanelHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) {}
}
