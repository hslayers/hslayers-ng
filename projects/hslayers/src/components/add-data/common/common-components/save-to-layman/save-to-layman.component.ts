import {Component, Input} from '@angular/core';

@Component({
  selector: 'hs-save-to-layman',
  templateUrl: 'save-to-layman.component.html',
})
export class HsSaveToLaymanComponent {
  @Input() data: any;
  constructor() {}
}
