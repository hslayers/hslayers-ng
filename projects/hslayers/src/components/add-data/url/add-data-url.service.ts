import {Injectable} from '@angular/core';

import {Subject} from 'rxjs';

import {AddDataUrlType} from './types/url.type';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';

class HsAddDataUrlParams {
  typeSelected: AddDataUrlType;
  addingAllowed: boolean;
  connectFromParams = true;
  addDataCapsParsingError: Subject<any> = new Subject();
}

@Injectable({
  providedIn: 'root',
})
export class HsAddDataUrlService {
  apps: {
    [id: string]: HsAddDataUrlParams;
  } = {default: new HsAddDataUrlParams()};

  constructor(
    public hsLog: HsLogService,
    public hsLanguageService: HsLanguageService,
    public hsLayoutService: HsLayoutService
  ) {}

  get(app: string): HsAddDataUrlParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsAddDataUrlParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Selects a service layer to be added (WMS | WMTS | ArcGIS Map Server)
   * @param services - Layer group of a service to select a layer from
   * @param layerToSelect - Layer to be selected (checked = true)
   * @param selector - Layer selector. Can be either 'Name' or 'Title'. Differs in between different services
   */
  selectLayerByName(
    layerToSelect: string,
    services,
    selector: 'Title' | 'Name'
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
          selector
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
    selector: 'Title' | 'Name'
  ): any {
    let selectedLayer;
    if (serviceLayer.Layer && serviceLayer[selector] != layerToSelect) {
      selectedLayer = this.selectLayerByName(
        layerToSelect,
        serviceLayer.Layer,
        selector
      );
    }
    if (serviceLayer[selector] == layerToSelect) {
      selectedLayer = this.setLayerCheckedTrue(
        layerToSelect,
        serviceLayer,
        selector
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
    selector: 'Title' | 'Name'
  ): any {
    if (serviceLayer[selector] == layerToSelect) {
      serviceLayer.checked = true;
    }
    return serviceLayer;
  }

  searchForChecked(records: Array<any>, app: string): void {
    this.get(app).addingAllowed =
      records?.some((l) => l.checked) ?? this.get(app).typeSelected == 'arcgis';
  }

  /**
   * For given array of layers (service layer definitions) it calculates a cumulative bounding box which encloses all the layers
   */
  calcCombinedExtent(layers: number[][]): number[] {
    return layers.reduce((acc, curr) => {
      //some services define layer bboxes beyond the canonical 180/90 degrees intervals, the checks are necessary then
      const [west, south, east, north] = curr;
      //minimum easting
      if (-180 <= west && west < acc[0]) {
        acc[0] = west;
      }
      //minimum northing
      if (-90 <= south && south < acc[1]) {
        acc[1] = south;
      }
      //maximum easting
      if (180 >= east && east > acc[2]) {
        acc[2] = east;
      }
      //maximum northing
      if (90 >= north && north > acc[3]) {
        acc[3] = north;
      }
      return acc;
    });
  }
}
