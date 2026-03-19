import {Directive, ViewContainerRef, inject} from '@angular/core';

@Directive({selector: '[hsPanelHost]'})
export class HsPanelHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}
