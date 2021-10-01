import {Component} from '@angular/core';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';

// import {HsDragDropLayerService} from './drag-drop-layer.service';

@Component({
  selector: 'hs-add-data-file',
  templateUrl: './add-data-file.component.html',
})
export class HsAddDataFileComponent {
  typeSelected: string;
  types: any[];

  constructor(
    public hsConfig: HsConfig,
    public hsLanguageService: HsLanguageService
  ) {
    if (Array.isArray(this.hsConfig.connectTypes)) {
      this.types = this.hsConfig.connectTypes;
    } else {
      this.types = [
        {
          id: 'kml',
          text: 'KML',
        },
        {
          id: 'gpx',
          text: 'GPX',
        },
        {
          id: 'geojson',
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

  isVectorType(): boolean {
    return (
      this.typeSelected == 'kml' ||
      // this.typeSelected == 'gpx' ||
      this.typeSelected == 'geojson'
    );
  }
}
