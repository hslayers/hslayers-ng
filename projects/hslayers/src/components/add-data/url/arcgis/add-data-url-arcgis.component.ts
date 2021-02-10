import {Component} from '@angular/core';

import {HsAddDataArcGisService} from './add-data-url-arcgis.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/arcgis/get-capabilities.service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsGetCapabilitiesErrorComponent} from '../../common/capabilities-error-dialog.component';
import {HsHistoryListService} from '../../../../common/history-list/history-list.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLogService} from '../../../../common/log/log.service';

@Component({
  selector: 'hs-add-data-url-arcgis',
  templateUrl: './add-data-url-arcgis.directive.html',
})
export class HsAddDataArcGisComponent {
  data;
  showDetails;
  sourceHistory;
  url;
  layerToSelect: any;
  error: any;

  constructor(
    public HsAddDataArcGisService: HsAddDataArcGisService,
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsEventBusService: HsEventBusService,
    public hsHistoryListService: HsHistoryListService,
    public HsLanguageService: HsLanguageService,
    public HsDialogContainerService: HsDialogContainerService,
    public hsLog: HsLogService
  ) {
    this.data = HsAddDataArcGisService.data;
    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type === 'arcgis') {
        this.setUrlAndConnect(uri, layer);
      }
    });

    this.hsEventBusService.owsCapabilitiesReceived.subscribe(
      async ({type, response}) => {
        if (type === 'ArcGIS') {
          try {
            await this.HsAddDataArcGisService.capabilitiesReceived(
              response,
              this.layerToSelect
            );
            if (this.layerToSelect) {
              this.addLayers(true);
            }
          } catch (e) {
            if (e.status == 401) {
              this.HsAddDataArcGisService.arcgisCapsParseError.next(
                'Unauthorized access. You are not authorized to query data from this service'
              );
              return;
            }
            this.HsAddDataArcGisService.arcgisCapsParseError.next(e);
          }
        }
        if (type === 'error') {
          this.HsAddDataArcGisService.arcgisCapsParseError.next(
            response.message
          );
        }
      }
    );

    this.HsAddDataArcGisService.arcgisCapsParseError.subscribe((e) => {
      this.hsLog.warn(e);
      this.url = null;
      this.showDetails = false;

      this.error = e.toString();
      if (this.error.includes('property')) {
        this.error = this.HsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS',
          'serviceTypeNotMatching'
        );
      }
      this.HsDialogContainerService.create(
        HsGetCapabilitiesErrorComponent,
        this.error
      );
    });
    //TODO: this.sourceHistory = this.HsAddDataArcGisService.sourceHistory;
  }

  hasNestedLayers = this.HsAddDataArcGisService.hasNestedLayers;
  getDimensionValues = this.HsAddDataArcGisService.getDimensionValues;

  /**
   * @function clear
   * @description Clear Url and hide detailsArcgis
   */
  clear(): void {
    this.url = '';
    this.showDetails = false;
  }

  connect = (layerToSelect): void => {
    this.hsHistoryListService.addSourceHistory('Arcgis', this.url);
    this.hsArcgisGetCapabilitiesService.requestGetCapabilities(this.url);
    this.HsAddDataArcGisService.data.getMapUrl = this.url;

    this.showDetails = true;
  };

  /**
   * @function selectAllLayers
   * @description Select all layers from service.
   */
  selectAllLayers(): void {
    /**
     * @param layer
     */
    function recurse(layer) {
      layer.checked = true;
      if (layer.Layer) {
        for (const sublayer of layer.Layer) {
          recurse(sublayer);
        }
      }
    }
    for (const layer of this.data.services.Layer) {
      recurse(layer);
    }
  }

  addLayers(checked): void {
    this.HsAddDataArcGisService.addLayers(checked);
  }

  srsChanged(): void {
    this.HsAddDataArcGisService.srsChanged();
  }

  /**
   * @function setUrlAndConnect
   * @description Connect to service of specified Url
   * @param {string} url Url of requested service
   * @param {string} layer Optional layer to select, when
   * getCapabilities arrives
   */
  setUrlAndConnect(url: string, layer): void {
    this.url = url;
    this.connect(layer);
  }
}
