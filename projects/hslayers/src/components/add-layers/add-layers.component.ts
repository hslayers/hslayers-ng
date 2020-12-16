import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsDragDropLayerService} from './drag-drop-layer.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';

@Component({
  selector: 'hs-add-layers',
  templateUrl: './partials/add-layers.directive.html',
  //TODO: require('./partials/add-layers.md.directive.html')
})
export class HsAddLayersComponent {
  showDetails: boolean;
  type: string;
  types: any[];

  constructor(
    public hsShareUrlService: HsShareUrlService,
    public hsConfig: HsConfig,
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public HsLanguageService: HsLanguageService,
    public HsDragDropLayerService: HsDragDropLayerService
  ) {
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
    //this.image_formats = []; TODO: unused?
    //this.query_formats = []; TODO: unused?
    //this.tile_size = 512; TODO: unused?

    this.hsEventBusService.owsFilling.subscribe(({type, uri, layer}) => {
      this.type = type.toLowerCase();
      this.hsEventBusService.owsConnecting.next({
        type: type,
        uri: uri,
        layer: layer,
      });
    });

    this.connectServiceFromUrlParam('wms');
    this.connectServiceFromUrlParam('wfs');
  }

  /**
   * @param type Type of OWS service
   */
  connectServiceFromUrlParam(type: string): void {
    const url = this.hsShareUrlService.getParamValue(`${type}_to_connect`);
    if (url) {
      const layers = this.hsShareUrlService.getParamValue(`${type}_layers`);
      this.hsLayoutService.setMainPanel('datasource_selector');
      this.type = type;
      const serviceName = `hsAddLayersWmsService`;
      if (layers) {
        for (const layer of layers.split(';')) {
          this.hsEventBusService.owsConnecting.next({
            type: type,
            uri: url,
            layer: layer,
          });
        }
      } else {
        this.hsEventBusService.owsConnecting.next({type: type, uri: url});
      }
    }
  }
}
