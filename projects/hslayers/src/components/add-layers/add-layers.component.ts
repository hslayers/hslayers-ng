import {Component} from '@angular/core';
import {HsConfig} from '../../config.service';
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
  types;

  constructor(
    public hsShareUrlService: HsShareUrlService,
    public hsConfig: HsConfig,
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public HsLanguageService: HsLanguageService
  ) {
    'ngInject';
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
   * Change detail panel template according to selected type
   *
   * @function templateByType
   * @returns {string} template Path to correct type template
   */
  templateByType(): string {
    /**TODO: move variables out of this function. Call $scope.connected = false when template change */
    let template: string;
    switch (this.type.toLowerCase()) {
      case 'wms':
        template = '<hs.add-layers-wms/>';
        break;
      case 'arcgis':
        template = '<hs.add-layers-arcgis/>';
        break;
      case 'wmts':
        template = '<hs.add-layers-wmts/>';
        break;
      case 'wfs':
        template = '<hs-add-layers-wfs/>';
        break;
      case 'vector':
        template = '<hs.add-layers-vector/>';
        this.showDetails = true;
        break;
      case 'shp':
        template = '<hs.add-layers-shp/>';
        this.showDetails = true;
        break;
      default:
        break;
    }
    return template;
  }

  /**
   * @param type
   */
  connectServiceFromUrlParam(type: string): void {
    if (this.hsShareUrlService.getParamValue(`${type}_to_connect`)) {
      const url = this.hsShareUrlService.getParamValue(`${type}_to_connect`);
      this.hsLayoutService.setMainPanel('datasource_selector');
      this.type = type.toUpperCase();
      this.hsEventBusService.owsConnecting.next({type: type, uri: url});
    }
  }
}
