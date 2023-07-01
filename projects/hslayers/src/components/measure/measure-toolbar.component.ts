import {Component} from '@angular/core';

import {HsLayoutService} from '../layout/layout.service';
import {HsToolbarPanelBaseComponent} from '../toolbar/toolbar-panel-base.component';

@Component({
  selector: 'hs-measure-toolbar',
  templateUrl: './measure-toolbar.component.html',
})
export class HsMeasureToolbarComponent extends HsToolbarPanelBaseComponent {
  constructor(public hsLayoutService: HsLayoutService) {
    super(hsLayoutService);
  }
  name = 'measureToolbar';
  isVisible(): boolean {
    return (
      this.hsLayoutService.panelEnabled('measure') &&
      this.hsLayoutService.componentEnabled('measureToolbar')
    );
  }

  measureButtonClicked(): void {
    this.hsLayoutService.setMainPanel('measure', true);
  }
}
