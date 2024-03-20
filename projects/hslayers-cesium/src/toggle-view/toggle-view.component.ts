import {AsyncPipe, NgClass} from '@angular/common';
import {Component} from '@angular/core';

import {HsGuiOverlayBaseComponent} from 'hslayers-ng/common/panels';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

import {HsCesiumService} from '../hscesium.service';

@Component({
  selector: 'hs-toggle-view',
  templateUrl: './toggle-view.component.html',
  styleUrl: './toggle-view.component.scss',
  standalone: true,
  imports: [AsyncPipe, TranslateCustomPipe, NgClass],
})
export class HsToggleViewComponent extends HsGuiOverlayBaseComponent {
  constructor(public hsCesiumService: HsCesiumService) {
    super();
  }
  name = 'toggleViewToolbar';

  /**
   * Lose focus so the :focus pseudo-class is unbind to prevent confusion.
   * @param element - target of click event
   */
  loseFocus(element) {
    //either the inner <i> element or parent <button> can be clicked
    element.blur();
    element.parentElement.blur();
  }
}
