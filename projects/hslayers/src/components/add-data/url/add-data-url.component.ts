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
    public hsLanguageService: HsLanguageService,
    public hsEventBusService: HsEventBusService,
    public hsShareUrlService: HsShareUrlService,
    public hsAddDataService: HsAddDataService,
    public hsLayoutService: HsLayoutService
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

    this.owsFillingSubscription = this.hsEventBusService.owsFilling.subscribe(
      ({type, uri, layer, sld}) => {
        this.typeSelected = type.toLowerCase();
        this.hsEventBusService.owsConnecting.next({
          type,
          uri,
          layer,
          sld,
        });
      }
    );

    if (this.hsAddDataService.urlType) {
      this.selectType(this.hsAddDataService.urlType);
      this.connectServiceFromUrlParam(this.hsAddDataService.urlType);
    }
  }
  ngOnDestroy(): void {
    this.owsFillingSubscription.unsubscribe();
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }

  connectServiceFromUrlParam(type): void {
    const layers = this.hsShareUrlService.getParamValue(`${type}_layers`);
    const url = this.hsShareUrlService.getParamValue(`${type}_to_connect`);

    // const serviceName = `hsAddLayersWmsService`;
    if (layers) {
      for (const layer of layers.split(';')) {
        this.hsEventBusService.owsConnecting.next({
          type,
          uri: url,
          layer,
          sld: undefined,
        });
      }
    } else {
      this.hsEventBusService.owsConnecting.next({type, uri: url});
      this.hsLayoutService.setMainPanel('addData');
    }
  }
}
