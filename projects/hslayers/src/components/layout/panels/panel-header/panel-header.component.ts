import {Component, Input} from '@angular/core';

import {HsLayoutService} from '../../layout.service';

@Component({
  selector: 'hs-panel-header',
  standalone: true,
  templateUrl: './panel-header.component.html',
})
export class HsPanelHeaderComponent {
  @Input() name: string;
  @Input() title: string;

  constructor(public HsLayoutService: HsLayoutService) {}

  closePanel(): void {
    this.HsLayoutService.closePanel(this.name);
  }
}
