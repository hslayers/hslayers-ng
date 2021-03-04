import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsAddDataService} from '../add-data.service';
import {HsConfig} from '../../../config.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsShareUrlService} from '../../permalink/share-url.service';

@Component({
  selector: 'hs-add-data-url',
  templateUrl: './add-data-url.html',
})
export class HsAddDataUrlComponent implements OnDestroy {
  typeSelected: string;
  types: any[];
  owsFillingSubscription: Subscription;

  constructor(
    public hsConfig: HsConfig,
    public HsLanguageService: HsLanguageService,
    public HsEventBusService: HsEventBusService,
    public HsShareUrlService: HsShareUrlService,
    public HsAddDataService: HsAddDataService,
    public HsLayoutService: HsLayoutService
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

    this.owsFillingSubscription = this.HsEventBusService.owsFilling.subscribe(
      ({type, uri, layer}) => {
        this.typeSelected = type.toLowerCase();
        this.HsEventBusService.owsConnecting.next({
          type: type,
          uri: uri,
          layer: layer,
        });
      }
    );

    if (this.HsAddDataService.urlType) {
      this.selectType(this.HsAddDataService.urlType);
      this.connectServiceFromUrlParam(this.HsAddDataService.urlType);
    }
  }
  ngOnDestroy(): void {
    this.owsFillingSubscription.unsubscribe();
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }

  connectServiceFromUrlParam(type): void {
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
      this.HsEventBusService.owsConnecting.next({type: type, uri: url});
      this.HsLayoutService.setMainPanel('addData');
    }
  }
}
