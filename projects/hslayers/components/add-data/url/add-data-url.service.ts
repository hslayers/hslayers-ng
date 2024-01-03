import {Injectable} from '@angular/core';

import {Subject} from 'rxjs';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {transform} from 'ol/proj';

import {AddDataUrlType} from './types/url.type';
import {HsLanguageService} from 'hslayers-ng/components/language';
import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/components/map';
import {HsToastService} from 'hslayers-ng/components/layout';
import {UrlDataObject} from './types/data-object.type';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataUrlService {
  typeSelected: AddDataUrlType;
  addingAllowed: boolean;
  connectFromParams = true;
  addDataCapsParsingError: Subject<any> = new Subject();

  constructor(
    public hsLog: HsLogService,
    public hsLanguageService: HsLanguageService,
    public hsLayoutService: HsLayoutService,
    private hsMapService: HsMapService,
    private hsToastService: HsToastService,
  ) {}

  /**
   * Selects a service layer to be added (WMS | WMTS | ArcGIS Map Server)
   * @param services - Layer group of a service to select a layer from
   * @param layerToSelect - Layer to be selected (checked = true)
   * @param selector - Layer selector. Can be either 'Name' or 'Title'. Differs in between different services
   */
  selectLayerByName(
    layerToSelect: string,
    services,
    selector: 'Title' | 'Name',
  ): any {
    if (!layerToSelect) {
      return;
    }
    let selectedLayer;
    if (Array.isArray(services)) {
      for (const serviceLayer of services) {
        selectedLayer = this.selectSubLayerByName(
          layerToSelect,
          serviceLayer,
          selector,
        );
        if (selectedLayer && serviceLayer[selector] == layerToSelect) {
          return selectedLayer;
        }
      }
    } else {
      return this.selectSubLayerByName(layerToSelect, services, selector);
    }
  }

  /**
   * Helper function for selectLayerByName()
   */
  private selectSubLayerByName(
    layerToSelect: string,
    serviceLayer,
    selector: 'Title' | 'Name',
  ): any {
    let selectedLayer;
    if (serviceLayer.Layer && serviceLayer[selector] != layerToSelect) {
      selectedLayer = this.selectLayerByName(
        layerToSelect,
        serviceLayer.Layer,
        selector,
      );
    }
    if (serviceLayer[selector] == layerToSelect) {
      selectedLayer = this.setLayerCheckedTrue(
        layerToSelect,
        serviceLayer,
        selector,
      );
    }
    return selectedLayer;
  }

  /**
   * Helper function for selectLayerByName()
   * Does the actual selection (checked = true)
   */
  private setLayerCheckedTrue(
    layerToSelect: string,
    serviceLayer,
    selector: 'Title' | 'Name',
  ): any {
    if (serviceLayer[selector] == layerToSelect) {
      serviceLayer.checked = true;
    }
    return serviceLayer;
  }

  searchForChecked(records: Array<any>): void {
    this.addingAllowed =
      records?.some((l) => l.checked) ?? this.typeSelected == 'arcgis';
  }

  /**
   * Calculate cumulative bounding box which encloses all the provided layers (service layer definitions)
   * Common for WMS/WMTS (WFS has its own implementation)
   */
  calcAllLayersExtent(layers: Layer<Source>[]): any {
    if (layers.length == 0) {
      return undefined;
    }
    try {
      const layerExtents = layers.map((lyr) => [...lyr?.getExtent()]); //Spread need to not create reference
      return this.calcCombinedExtent(layerExtents);
    } catch (error) {
      this.hsToastService.createToastPopupMessage(
        'ADDLAYERS.capabilitiesParsingProblem',
        'ADDLAYERS.layerExtentParsingProblem',
        {
          serviceCalledFrom: 'HsAddDataUrlService',
          toastStyleClasses: 'bg-warning text-white',
        },
      );
      return undefined;
    }
  }

  /**
   * For given array of layers (service layer definitions) it calculates a cumulative bounding box which encloses all the layers
   */
  calcCombinedExtent(extents: number[][]): number[] {
    const currentMapProj = this.hsMapService.getCurrentProj();
    const bounds = transform([180, 90], 'EPSG:4326', currentMapProj);

    return extents.reduce((acc, curr) => {
      //some services define layer bboxes beyond the canonical 180/90 degrees intervals, the checks are necessary then
      const [west, south, east, north] = curr;
      //minimum easting
      if (bounds[1] * -1 <= west && west < acc[0]) {
        acc[0] = west;
      }
      //minimum northing
      if (bounds[0] * -1 <= south && south < acc[1]) {
        acc[1] = south;
      }
      //maximum easting
      if (bounds[1] >= east && east > acc[2]) {
        acc[2] = east;
      }
      //maximum northing
      if (bounds[0] >= north && north > acc[3]) {
        acc[3] = north;
      }
      return acc;
    });
  }

  /**
   * Zoom map to one layers or combined layer list extent
   */
  zoomToLayers(data: UrlDataObject) {
    if (data.extent) {
      this.hsMapService.fitExtent(data.extent);
    }
  }
}
