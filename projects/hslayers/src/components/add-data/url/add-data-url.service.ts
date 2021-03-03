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
    public HsLanguageService: HsLanguageService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsLayoutService: HsLayoutService
  ) {
    this.addDataCapsParsingError.subscribe((e) => {
      this.hsLog.warn(e);

      let error = e.toString();
      if (error.includes('property')) {
        error = this.HsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS',
          'serviceTypeNotMatching'
        );
      }
      this.HsDialogContainerService.create(
        HsGetCapabilitiesErrorComponent,
        error
      );
    });
  }

  /**
   * Selects a service layer to be added (WMS | ArcGIS Map Server)
   * @param services Layer group of a service to select a layer from
   * @param layerToSelect Layer to be selected (checked = true)
   * @param selector Layer selector. Differs in between different services
   */
  selectLayerByName(
    layerToSelect: string,
    services: any,
    selector: 'Title' | 'Name'
  ): void {
    if (!layerToSelect) {
      return;
    }
    for (const service of services) {
      if (service.Layer) {
        for (const layer of service.Layer) {
          if (layer[selector] == layerToSelect) {
            layer.checked = true;
            this.scrollToLayer(layer[selector]);
            return;
          }
        }
      } else {
        if (service[selector] == layerToSelect) {
          service.checked = true;
          this.scrollToLayer(service[selector]);
        }
      }
    }
  }

  scrollToLayer(name: string): void {
    setTimeout(() => {
      const id = `#hs-add-layer-${name}`;
      const el = this.HsLayoutService.contentWrapper.querySelector(id);
      if (el) {
        el.scrollIntoView();
      }
    }, 1000);
  }

  searchForChecked(services: Array<any>): boolean {
    return services.some((service) => service.checked);
  }
}
