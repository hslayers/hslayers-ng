import {Component} from '@angular/core';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';
import {HsEventBusService} from '../../core/event-bus.service';

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
    public hsEventBusService: HsEventBusService,
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

    this.hsEventBusService.owsFilling.subscribe(({type, uri, layer}) => {
      this.typeSelected = type.toLowerCase();
      this.hsEventBusService.owsConnecting.next({
        type: type,
        uri: uri,
        layer: layer,
      });
    });
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }
}
