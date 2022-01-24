import {Injectable} from '@angular/core';

import {Subject} from 'rxjs';

import {HsAddDataService} from '../add-data.service';
import {HsAddDataUrlService} from '../url/add-data-url.service';
import {HsDimensionService} from '../../../common/get-capabilities/dimension.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsMapService} from '../../map/map.service';
import {HsToastService} from '../../layout/toast/toast.service';

@Injectable({providedIn: 'root'})
export class HsAddDataCommonService {
  layerToSelect: string;
  loadingInfo = false;
  showDetails = false;
  url: string;
  //TODO: all dimension related things need to be refactored into separate module
  getDimensionValues = this.hsDimensionService.getDimensionValues;
  serviceLayersCalled: Subject<{url: string}> = new Subject();
  constructor(
    public hsMapService: HsMapService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsToastService: HsToastService,
    public hsAddDataService: HsAddDataService,
    public hsDimensionService: HsDimensionService,
    public hsEventBusService: HsEventBusService
  ) {
    this.hsAddDataService.cancelUrlRequest.subscribe(() => {
      this.clearParams();
    });
  }
  clearParams(): void {
    this.layerToSelect = '';
    this.loadingInfo = false;
    this.showDetails = false;
    this.url = '';
    this.hsAddDataUrlService.typeSelected = null;
  }

  setPanelToCatalogue(): void {
    this.hsAddDataService.dsSelected = 'catalogue';
  }

  /**
   * For the sake of possible future implementation changes
   * @param url - URL to be set
   */
  updateUrl(url: string): void {
    this.url = url;
  }

  checkTheSelectedLayer(services: any) {
    if (!services) {
      return;
    }
    for (const layer of services) {
      //TODO: If Layman allows layers with different casing,
      // then remove the case lowering
      const layerName = layer.Name?.toLowerCase() ?? layer.Title?.toLowerCase();
      if (layerName === this.layerToSelect.toLowerCase()) {
        layer.checked = true;
      }
    }
  }

  displayParsingError(e: any): void {
    if (e?.status === 401) {
      this.hsToastService.createToastPopupMessage(
        'ADDLAYERS.capabilitiesParsingProblem',

        'ADDLAYERS.unauthorizedAccess',
        {serviceCalledFrom: 'HsAddDataCommonUrlService'}
      );
    } else {
      this.hsAddDataUrlService.addDataCapsParsingError.next(e);
    }
  }

  throwParsingError(e): void {
    this.clearParams();
    this.displayParsingError(e);
  }

  //NOTE* - Is this method even needed?
  srsChanged(srs): any {
    setTimeout(() => {
      return !this.currentProjectionSupported([srs]);
    }, 0);
  }

  /**
   * Test if current map projection is in supported projection list
   *
   * @param srss - List of supported projections
   * @returns True if map projection is in list, otherwise false
   */
  currentProjectionSupported(srss: string[]): boolean {
    if (!srss || srss.length === 0) {
      return false;
    }
    let found = false;
    for (const val of srss) {
      if (!val) {
        found = false;
      } else {
        if (
          this.hsMapService.map
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
