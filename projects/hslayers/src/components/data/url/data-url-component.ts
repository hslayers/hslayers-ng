import {Component} from '@angular/core';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from './../../language/language.service';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-data-url ',
  templateUrl: './data-url.html',
})
export class HsDataUrlComponent {
  typeSelected: string;
  types: any[];

  constructor(
    public hsConfig: HsConfig,
    public HsLanguageService: HsLanguageService
  ) {
    this.types = [
      {
        id: 'wms',
        text: () =>
          this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.WMS'),
      },
      {
        id: 'arcgis',
        text: () =>
          this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.ArcGIS'),
      },
      {
        id: 'wmts',
        text: () =>
          this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.vectorFile'),
      },
      {
        id: 'wfs',
        text: () =>
          this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.WFS'),
      },
    ];

    this.typeSelected = '';
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }
}
