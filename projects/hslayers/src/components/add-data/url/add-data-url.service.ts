import {Injectable} from '@angular/core';

import {Subject} from 'rxjs';

import {AddDataUrlType} from './types/url.type';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsGetCapabilitiesErrorComponent} from './../common/capabilities-error-dialog/capabilities-error-dialog.component';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataUrlService {
  addDataCapsParsingError: Subject<any> = new Subject();
  addingAllowed: boolean;
  typeSelected: AddDataUrlType;
  connectFromParams = true;
  constructor(
    public hsLog: HsLogService,
    public hsLanguageService: HsLanguageService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLayoutService: HsLayoutService
  ) {
    this.addDataCapsParsingError.subscribe((e) => {
      this.hsLog.warn(e);
      let error = e.toString();
      if (error?.includes('Unsuccessful OAuth2')) {
        error = this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          'Authentication failed. Login to the catalogue.'
        );
      } else if (error.includes('property')) {
        error = this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS',
          'serviceTypeNotMatching'
        );
      } else {
        error = this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS',
          error
        );
      }
      this.hsDialogContainerService.create(
        HsGetCapabilitiesErrorComponent,
        error
      );
    });
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

  searchForChecked(records: Array<any>): void {
    this.addingAllowed =
      records?.some((l) => l.checked) ?? this.typeSelected == 'arcgis';
  }
}
