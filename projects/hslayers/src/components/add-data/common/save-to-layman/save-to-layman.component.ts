import {Component, Input} from '@angular/core';

import {DEFAULT_VECTOR_LOAD_TYPE} from '../../enums/load-types.const';
import {FileDataObject} from '../../file/types/file-data-object.type';

@Component({
  selector: 'hs-save-to-layman',
  templateUrl: 'save-to-layman.component.html',
})
export class HsSaveToLaymanComponent {
  @Input() data: FileDataObject;
  @Input() app = 'default';

  constructor() {}

  setSaveToLayman(save: boolean) {
    this.data.saveToLayman = save;
    if (save) {
      this.data.loadAsType = DEFAULT_VECTOR_LOAD_TYPE;
    } else {
      this.data.loadAsType = undefined;
    }
  }
}
