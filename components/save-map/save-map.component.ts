import {Component} from '@angular/core';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsSaveMapDialogSpawnerService} from './dialog-spawner.service';
import {HsSaveMapManagerService} from './save-map-manager.service';

@Component({
  selector: 'hs-save-map',
  templateUrl: './partials/panel.html',
})
export class HsSaveMapComponent {
  endpoint = null;

  constructor(
    //Used in template
    public HsConfig: HsConfig,
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    //Running in background and watching observables
    public HsSaveMapDialogSpawnerService: HsSaveMapDialogSpawnerService
  ) {
    this.HsSaveMapManagerService.panelOpened.subscribe((composition) => {
      if (composition && composition.endpoint) {
        const openedType = composition.endpoint.type;
        const found = this.HsCommonEndpointsService.endpoints.filter(
          (ep) => ep.type == openedType
        );
        if (found.length > 0) {
          this.HsSaveMapManagerService.selectEndpoint(found[0]);
        }
      }
    });

    this.HsCommonEndpointsService.endpointsFilled.subscribe((value) => {
      if (value.length > 0 && !this.endpoint) {
        const laymans = value.filter((ep) => ep.type == 'layman');
        if (laymans.length > 0) {
          this.HsSaveMapManagerService.selectEndpoint(laymans[0]);
        } else {
          this.HsSaveMapManagerService.selectEndpoint(value[0]);
        }
        if (this.endpoint && this.endpoint.type == 'layman') {
          this.HsCommonLaymanService.getCurrentUser(this.endpoint);
        }
      }
    });

    this.HsSaveMapManagerService.endpointSelected.subscribe((endpoint) => {
      if (endpoint) {
        this.endpoint = endpoint;
        if (endpoint.getCurrentUserIfNeeded) {
          endpoint.getCurrentUserIfNeeded(endpoint);
        }
      }
    });
  }
}
