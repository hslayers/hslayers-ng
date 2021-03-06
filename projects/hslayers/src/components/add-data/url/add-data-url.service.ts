import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsGetCapabilitiesErrorComponent} from '../common/capabilities-error-dialog.component';
import {HsLanguageService} from '../../language/language.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataUrlService {
  addDataCapsParsingError: Subject<{e: any; context: any}> = new Subject();

  constructor(
    public hsLog: HsLogService,
    public hsLanguageService: HsLanguageService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLayoutService: HsLayoutService
  ) {
    this.addDataCapsParsingError.subscribe((e) => {
      this.hsLog.warn(e);

      let error = e.toString();
      if (error.includes('property')) {
        error = this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS',
          'serviceTypeNotMatching'
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
  ): void {
    if (!layerToSelect) {
      return;
    }
    if (Array.isArray(services)) {
      for (const serviceLayer of services) {
        this.selectSubLayerByName(layerToSelect, serviceLayer, selector);
      }
    } else {
      this.selectSubLayerByName(layerToSelect, services, selector);
    }
  }

  /**
   * Helper function for selectLayerByName()
   */
  private selectSubLayerByName(
    layerToSelect: string,
    serviceLayer,
    selector: 'Title' | 'Name'
  ): void {
    if (serviceLayer.Layer) {
      this.selectLayerByName(layerToSelect, serviceLayer.Layer, selector);
    } else {
      this.setLayerCheckedTrue(layerToSelect, serviceLayer, selector);
    }
  }

  /**
   * Helper function for selectLayerByName()
   * Does the actual selection (checked = true)
   */
  private setLayerCheckedTrue(
    layerToSelect: string,
    serviceLayer,
    selector: 'Title' | 'Name'
  ): void {
    if (serviceLayer[selector] == layerToSelect) {
      serviceLayer.checked = true;
      this.scrollToLayer(serviceLayer[selector]);
    }
  }

  scrollToLayer(name: string): void {
    setTimeout(() => {
      const id = `#hs-add-layer-${name}`;
      const el = this.hsLayoutService.contentWrapper.querySelector(id);
      if (el) {
        el.scrollIntoView();
      }
    }, 1000);
  }

  searchForChecked(services: Array<any>): boolean {
    return services.some((service) => service.checked);
  }
}
