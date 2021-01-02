import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
// import {HsDragDropLayerService} from './drag-drop-layer.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';

@Component({
  selector: 'hs-data',
  templateUrl: './data.directive.html',
})
export class HsDataComponent {
  typeSelected: string;
  types: any[];
  type: string;

  constructor(
    public hsShareUrlService: HsShareUrlService,
    public hsConfig: HsConfig,
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public HsLanguageService: HsLanguageService // public HsDragDropLayerService: HsDragDropLayerService
  ) {
    console.log(this);
    if (Array.isArray(this.hsConfig.connectTypes)) {
      this.types = this.hsConfig.connectTypes;
    } else {
      this.types = [
        {
          id: 'wms',
          text: () =>
            this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.WMS'),
        },
        {
          id: 'wmts',
          text: () =>
            this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.WMS'),
        },
        {
          id: 'arcgis',
          text: () =>
            this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.ArcGIS'),
        },
        {
          id: 'vector',
          text: () =>
            this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.vectorFile'),
        },
        {
          id: 'shp',
          text: () =>
            this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.shapeFile'),
        },
        {
          id: 'wfs',
          text: () =>
            this.HsLanguageService.getTranslation('ADDLAYERS.TYPES.WFS'),
        },
      ];
    }

    this.type = '';
  }

  datasetSelect(type: string): void {
    this.typeSelected = type;
  }
}
