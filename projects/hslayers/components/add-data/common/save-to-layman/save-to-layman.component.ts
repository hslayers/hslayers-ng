import {Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {DEFAULT_VECTOR_LOAD_TYPE} from '../../enums/load-types.const';
import {FileDataObject} from 'hslayers-ng/types';
import {HsCommonLaymanAccessRightsComponent} from 'hslayers-ng/common/layman';

@Component({
  selector: 'hs-save-to-layman',
  templateUrl: 'save-to-layman.component.html',
  imports: [NgClass, HsCommonLaymanAccessRightsComponent, TranslatePipe],
})
export class HsSaveToLaymanComponent {
  @Input() data: FileDataObject;

  descriptionVisible = false;

  constructor() {}

  setSaveToLayman(save: boolean) {
    this.data.saveToLayman = save;
    if (save) {
      this.data.loadAsType = DEFAULT_VECTOR_LOAD_TYPE;
    } else {
      this.data.loadAsType = undefined;
    }
  }

  toggleDescVisibility() {
    this.descriptionVisible = !this.descriptionVisible;
  }
}
