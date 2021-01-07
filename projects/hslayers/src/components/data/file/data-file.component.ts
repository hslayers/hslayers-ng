import {Component} from '@angular/core';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from './../../language/language.service';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-data-file',
  templateUrl: './data-file.html',
})
export class HsDataFileComponent {
  typeSelected: string;
  types: any[];

  constructor(
    public hsConfig: HsConfig,
    public HsLanguageService: HsLanguageService
  ) {
    if (Array.isArray(this.hsConfig.connectTypes)) {
      this.types = this.hsConfig.connectTypes;
    } else {
      this.types = [
        {
          id: 'vector',
          text: 'KML',
        },
        {
          id: 'vector',
          text: 'GeoJSON',
        },
        {
          id: 'shp',
          text: 'Shapefile',
        },
      ];
    }
    this.typeSelected = '';
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }
}
