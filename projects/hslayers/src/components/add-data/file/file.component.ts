import {Component, Input} from '@angular/core';

import {AddDataFileType, filesSupported} from './types/file.type';
import {AddDataFileValues} from './file-type-values';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-add-data-file',
  templateUrl: './file.component.html',
})
export class HsAddDataFileComponent {
  @Input() app = 'default';
  typeSelected: AddDataFileType;
  types: {id: AddDataFileType; text: string}[];

  constructor(
    public hsConfig: HsConfig,
    public hsLanguageService: HsLanguageService
  ) {
    if (Array.isArray(this.hsConfig.get(this.app).uploadTypes)) {
      this.types = this.hsConfig
        .get(this.app)
        .uploadTypes.filter((type) => filesSupported.includes(type))
        .map((type) => AddDataFileValues.find((v) => v.id == type));
    } else {
      this.types = AddDataFileValues;
    }
  }

  selectType(type: AddDataFileType): void {
    this.typeSelected = type;
  }

  //Not being used
  isVectorType(): boolean {
    return (
      this.typeSelected == 'kml' ||
      this.typeSelected == 'gpx' ||
      this.typeSelected == 'geojson'
    );
  }
}
