import {Component} from '@angular/core';
import {HsConfig} from '../../../config.service';
import {HsLanguageService} from '../../language/language.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsShareUrlService} from '../../permalink/share-url.service';
import {HsDataService} from '../data.service';
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
    public HsEventBusService: HsEventBusService,
    public HsShareUrlService: HsShareUrlService,
    public HsDataService: HsDataService
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

    this.HsEventBusService.owsFilling.subscribe(({type, uri, layer}) => {
      this.typeSelected = type.toLowerCase();
      this.HsEventBusService.owsConnecting.next({
        type: type,
        uri: uri,
        layer: layer,
      });
    });

    console.log('URLstarting')
    if (this.HsDataService.urlType){
      this.selectType(this.HsDataService.urlType);
      this.connectServiceFromUrlParam(this.HsDataService.urlType);
    }
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }

  connectServiceFromUrlParam(type) {
    const layers = this.HsShareUrlService.getParamValue(`${type}_layers`);
    const url = this.HsShareUrlService.getParamValue(`${type}_to_connect`);

    // const serviceName = `hsAddLayersWmsService`;
    if (layers) {

      for (const layer of layers.split(';')) {
        this.HsEventBusService.owsConnecting.next({
          type: type,
          uri: url,
          layer: layer,
        });
      }
    } else {
      this.HsEventBusService.owsConnecting.next({ type: type, uri: url });
    }
  }

}
