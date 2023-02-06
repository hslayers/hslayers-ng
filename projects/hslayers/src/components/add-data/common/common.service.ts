import {Injectable} from '@angular/core';

import {Subject} from 'rxjs';

import {HsAddDataService} from '../add-data.service';
import {HsAddDataUrlService} from '../url/add-data-url.service';
import {HsDimensionService} from '../../../common/get-capabilities/dimension.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsMapService} from '../../map/map.service';
import {HsToastService} from '../../layout/toast/toast.service';

class HsAddDataCommonParams {
  layerToSelect: string;
  loadingInfo = false;
  showDetails = false;
  url: string;
}

@Injectable({providedIn: 'root'})
export class HsAddDataCommonService {
  apps: {
    [id: string]: HsAddDataCommonParams;
  } = {default: new HsAddDataCommonParams()};

  //TODO: all dimension related things need to be refactored into separate module
  getDimensionValues = this.hsDimensionService.getDimensionValues;
  serviceLayersCalled: Subject<{url: string; app: string}> = new Subject();
  constructor(
    public hsMapService: HsMapService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsToastService: HsToastService,
    public hsAddDataService: HsAddDataService,
    public hsDimensionService: HsDimensionService,
    public hsEventBusService: HsEventBusService
  ) {
    this.hsAddDataService.cancelUrlRequest.subscribe((app) => {
      this.clearParams(app);
    });
  }

  get(app: string): HsAddDataCommonParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsAddDataCommonParams();
    }
    return this.apps[app ?? 'default'];
  }

  clearParams(app: string): void {
    const appRef = this.get(app);
    appRef.layerToSelect = '';
    appRef.loadingInfo = false;
    appRef.showDetails = false;
    appRef.url = '';
    this.hsAddDataUrlService.get(app).typeSelected = null;
  }

  setPanelToCatalogue(app: string): void {
    this.hsAddDataService.apps[app].dsSelected = 'catalogue';
  }

  /**
   * For the sake of possible future implementation changes
   * @param url - URL to be set
   */
  updateUrl(url: string, app: string): void {
    this.get(app).url = url;
  }

  checkTheSelectedLayer(services: any, serviceType: string, app: string) {
    if (!services) {
      return;
    }
    const nameOrTitle = serviceType !== 'wmts';
    for (const layer of services) {
      //TODO: If Layman allows layers with different casing,
      // then remove the case lowering
      const layerName = nameOrTitle
        ? layer.Name?.toLowerCase() ?? layer.Title?.toLowerCase()
        : layer.Identifier?.toLowerCase();
      if (layerName === this.get(app).layerToSelect.toLowerCase()) {
        layer.checked = true;
      }
    }
  }

  displayParsingError(e: any, app: string): void {
    if (e?.status === 401) {
      this.hsToastService.createToastPopupMessage(
        'ADDLAYERS.capabilitiesParsingProblem',
        'ADDLAYERS.unauthorizedAccess',
        {serviceCalledFrom: 'HsAddDataCommonUrlService'},
        app
      );
    } else {
      this.hsAddDataUrlService.apps[app].addDataCapsParsingError.next(e);
    }
  }

  throwParsingError(e, app: string): void {
    this.clearParams(app);
    this.displayParsingError(e, app);
  }

  //NOTE* - Is this method even needed?
  srsChanged(srs, app: string): any {
    setTimeout(() => {
      return !this.currentProjectionSupported([srs], app);
    }, 0);
  }

  /**
   * Test if current map projection is in supported projection list
   *
   * @param srss - List of supported projections
   * @returns True if map projection is in list, false otherwise
   */
  currentProjectionSupported(srss: string[], app: string): boolean {
    if (!srss || srss.length === 0) {
      return false;
    }
    let found = false;
    for (const val of srss) {
      if (!val) {
        found = false;
      } else {
        if (
          this.hsMapService
            .getMap(app)
            .getView()
            .getProjection()
            .getCode()
            .toUpperCase() == val.toUpperCase()
        ) {
          found = true;
        }
      }
    }
    return found;
  }

  /**
   * Constructs body of LAYER parameter for getMap request
   * @param layerOrLayers - layer object or layers received from capabilities. If no layer is provided
   * merge all checked layer ids into one string
   * @param property - layer property
   * @returns
   */
  createBasemapName(layerOrLayers: any | Array<any>, property: string): string {
    let baseName = '';
    if (Array.isArray(layerOrLayers)) {
      for (const layer of layerOrLayers) {
        if (layer.checked) {
          baseName = layer[property];
          break;
        } else {
          if (layer.Layer) {
            baseName = baseName.concat(
              this.createBasemapName(layer.Layer, property)
            );
          }
        }
      }
    } else {
      baseName = layerOrLayers[property];
    }
    return baseName;
  }

  /**
   * @param service -
   */
  getSublayerNames(service): string {
    if (service.Layer) {
      return service.Layer.map((l) => {
        let tmp: string[] = [];
        if (l.Name) {
          tmp.push(l.Name);
        }
        if (l.Layer) {
          const children = this.getSublayerNames(l);
          tmp = tmp.concat(children);
        }
        return tmp.join(',');
      });
    } else {
      return '';
    }
  }
}
