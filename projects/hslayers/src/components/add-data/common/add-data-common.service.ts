import {Injectable} from '@angular/core';

import {HsAddDataService} from '../add-data.service';
import {HsAddDataUrlService} from '../url/add-data-url.service';
import {HsDimensionService} from '../../../common/get-capabilities/dimension.service';
import {HsMapService} from '../../map/map.service';
import {HsToastService} from '../../layout/toast/toast.service';

@Injectable({providedIn: 'root'})
export class HsAddDataCommonUrlService {
  layerToSelect: string;
  loadingInfo = false;
  showDetails = false;
  url: string;

  //TODO: all dimension related things need to be refactored into separate module
  getDimensionValues = this.hsDimensionService.getDimensionValues;

  constructor(
    public hsMapService: HsMapService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsToastService: HsToastService,
    public hsAddDataService: HsAddDataService,
    public hsDimensionService: HsDimensionService
  ) {
    this.hsAddDataService.cancelUrlRequest.subscribe(() => {
      this.clear();
    });
  }
  clear(): void {
    this.layerToSelect = '';
    this.loadingInfo = false;
    this.showDetails = false;
    this.url = '';
  }

  /**
   * For the sake of possible future implementation changes
   * @param url - URL to be set
   */
  updateUrl(url: string): void {
    this.url = url;
  }

  displayParsingError(e: any): void {
    if (e?.status === 401) {
      this.hsToastService.createToastPopupMessage(
        'ADDLAYERS.capabilitiesParsingProblem',

        'ADDLAYERS.unauthorizedAccess',
        {serviceCalledFrom: 'hsAddDataArcgisService'}
      );
    } else {
      this.hsAddDataUrlService.addDataCapsParsingError.next(e);
    }
  }

  throwParsingError(e): void {
    this.clear();
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
  getSublayerNames(service): any[] {
    if (service.Layer) {
      return service.Layer.map((l) => {
        const tmp: any = {};
        if (l.Name) {
          tmp.name = l.Name;
        }
        if (l.Layer) {
          tmp.children = this.getSublayerNames(l);
        }
        return tmp;
      });
    } else {
      return [];
    }
  }
}
