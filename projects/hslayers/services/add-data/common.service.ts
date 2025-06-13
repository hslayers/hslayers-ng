import {Injectable} from '@angular/core';

import {Subject} from 'rxjs';

import {HsAddDataService} from './add-data.service';
import {HsAddDataUrlService} from './url/add-data-url.service';
import {HsDimensionService} from 'hslayers-ng/services/get-capabilities';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsToastService} from 'hslayers-ng/common/toast';
import {OwsType} from 'hslayers-ng/types';

@Injectable({providedIn: 'root'})
export class HsAddDataCommonService {
  layerToSelect: string | string[];
  loadingInfo = false;
  showDetails = false;
  url: string;

  //TODO: all dimension related things need to be refactored into separate module
  getDimensionValues = this.hsDimensionService.getDimensionValues;
  serviceLayersCalled: Subject<string> = new Subject();
  constructor(
    public hsMapService: HsMapService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsToastService: HsToastService,
    public hsAddDataService: HsAddDataService,
    public hsDimensionService: HsDimensionService,
    public hsEventBusService: HsEventBusService,
  ) {
    this.hsEventBusService.cancelAddDataUrlRequest.subscribe(() => {
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
    this.hsAddDataService.selectType('catalogue');
  }

  /**
   * For the sake of possible future implementation changes
   * @param url - URL to be set
   */
  updateUrl(url: string): void {
    this.url = url;
  }

  checkTheSelectedLayer(services: any, serviceType: OwsType['type']): void {
    if (!services) {
      return;
    }
    const nameOrTitle = serviceType !== 'wmts';
    for (const layer of services) {
      const layerName = nameOrTitle
        ? (layer.Name?.toLowerCase() ??
          layer.name?.toLowerCase() ??
          layer.Title?.toLowerCase() ??
          layer.title?.toLowerCase())
        : layer.Identifier?.toLowerCase();

      if (serviceType === 'arcgis') {
        layer.checked = Array.isArray(this.layerToSelect)
          ? this.layerToSelect.some(
              (lt) =>
                layerName === lt.toLowerCase() ||
                layer.id?.toString().toLowerCase() === lt.toLowerCase(),
            )
          : layerName === this.layerToSelect.toLowerCase() ||
            layer.id?.toString().toLowerCase() ===
              this.layerToSelect.toLowerCase();
      } else {
        const singleLayerSelected = !this.layerToSelect.includes(',');

        /**
         * If single layer is selected, check if the layer name matches the selected layer
         * If multiple layers are selected (group), check if the layer name matches any of the selected layers
         */
        layer.checked = singleLayerSelected
          ? layerName === (this.layerToSelect as string).toLowerCase()
          : (this.layerToSelect as string)
              .split(',')
              .some((lt) => layerName === lt.toLowerCase());
      }
    }
  }

  displayParsingError(e: any): void {
    let errorMessage = 'ADDLAYERS.capabilitiesParsingProblem';
    const errorDetails = e?.message || e?.toString() || 'Unknown error';

    if (e?.status === 401) {
      errorMessage = 'ADDLAYERS.unauthorizedAccess';
    } else if (errorDetails && errorDetails.includes('Unsuccessful OAuth2')) {
      errorMessage = 'COMMON.Authentication failed. Login to the catalogue.';
    } else if (errorDetails.includes('property')) {
      errorMessage = 'ADDLAYERS.serviceTypeNotMatching';
    } else if (errorDetails.startsWith('ADDLAYERS.')) {
      errorMessage = errorDetails;
    } else {
      errorMessage = `ADDLAYERS.${errorDetails}`;
    }

    this.hsToastService.createToastPopupMessage(
      'ADDLAYERS.capabilitiesParsingProblem',
      errorMessage,
      {serviceCalledFrom: 'HsAddDataCommonService', customDelay: 10000},
    );
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
   * @returns True if map projection is in list, false otherwise
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
          this.hsMapService
            .getMap()
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
   * Constructs body of LAYER parameter for getMap request for grouped layer e.g.
   * for a basemap or thematic layer with property group set to true
   * @param layerOrLayers - layer object or layers received from capabilities. If no layer is provided
   * merge all checked layer ids into one string
   * @param property - layer property
   */
  getGroupedLayerNames(
    layerOrLayers: any | Array<any>,
    property: string,
  ): string {
    const baseNameParts = [];
    if (Array.isArray(layerOrLayers)) {
      for (const layer of layerOrLayers) {
        if (layer.checked) {
          baseNameParts.push(layer[property]);
        } else if (layer.Layer) {
          const nested = this.getGroupedLayerNames(layer.Layer, property);
          nested.length > 0 ? baseNameParts.push(nested) : null;
        }
      }
    } else {
      baseNameParts[0] = layerOrLayers[property];
    }
    return baseNameParts.join();
  }

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
    }
    return '';
  }
}
