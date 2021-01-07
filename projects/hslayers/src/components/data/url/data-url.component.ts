import {Component} from '@angular/core';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';

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
    public HsLanguageService: HsLanguageService,
  ) {
    if (Array.isArray(this.hsConfig.connectTypes)) {
      this.types = this.hsConfig.connectTypes;
    } else {
      this.types = [
        {
          id: 'wms',
          text: 'WMS',
        },
        {
          id: 'wmts',
          text: 'WMTS',
        },
        {
          id: 'wfs',
          text: 'WFS',
        },
        {
          id: 'kml',
          text: 'KML',
        },
        {
          id: 'geojson',
          text: 'GeoJSON',
        },
        {
          id: 'arcgis',
          text: 'ArcGIS Map Server',
        },
      ];
    }
    this.typeSelected = '';
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }
}
