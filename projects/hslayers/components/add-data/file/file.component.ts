import {Component} from '@angular/core';

import {AddDataFileType, FILES_SUPPORTED} from 'hslayers-ng/types';
import {AddDataFileValues} from './file-type-values';
import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-add-data-file',
  templateUrl: './file.component.html',
})
export class HsAddDataFileComponent {
  typeSelected: AddDataFileType;
  types: {id: AddDataFileType; text: string}[];

  constructor(
    public hsConfig: HsConfig,
    public hsLanguageService: HsLanguageService,
  ) {
    if (Array.isArray(this.hsConfig.uploadTypes)) {
      this.types = this.hsConfig.uploadTypes
        .filter((type) => FILES_SUPPORTED.includes(type))
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
