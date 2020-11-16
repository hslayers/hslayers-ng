import {Component, Input} from '@angular/core';
import {HsLayoutService} from '../layout.service';
@Component({
  selector: 'hs-panel-header',
  templateUrl: './panel-header.directive.html',
})
export class HsPanelHeaderComponent {
  @Input() name: string;
  @Input() title: string;
  /*transclude: {
    'extraButtons': '?extraButtons',
    'extraTitle': '?extraTitle',
  },*/

  constructor(public HsLayoutService: HsLayoutService) {}

  /**
   *
   * @memberof hs-panel-header.component
   * @function closePanel
   */
  closePanel(): void {
    this.HsLayoutService.closePanel(this.name);
  }
}
