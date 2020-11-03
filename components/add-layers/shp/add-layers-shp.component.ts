import {Component} from '@angular/core';

import {HsAddLayersShpService} from './add-layers-shp.service';
import {HsAddLayersWmsService} from '../wms/add-layers-wms.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLayoutService} from '../../layout/layout.service';

@Component({
  selector: 'hs-add-layers-shp',
  template: require('./add-shp-layer.directive.html'),
})
export class HsAddLayersShpComponent {
  abstract: string;
  endpoint = null;
  errorDetails = {};
  errorMessage: any;
  extract_styles = false;
  files = null;
  loaderImage = require('../../../img/ajax-loader.gif');
  loading: boolean;
  name: string;
  resultCode: string;
  sld = null;
  srs = 'EPSG:4326';
  title = '';

  constructor(
    private hsAddLayersShpService: HsAddLayersShpService,
    private hsLayoutService: HsLayoutService,
    private hsLaymanService: HsLaymanService,
    private hsAddLayersWmsService: HsAddLayersWmsService,
    private hsCommonEndpointsService: HsCommonEndpointsService
  ) {
    //vm.endpointsService = HsCommonEndpointsService;
  }

  /**
   * @description From available endpoints picks one
   * - either Layman enpoint if available or any other if not
   */
  pickEndpoint(): void {
    const endpoints = this.hsCommonEndpointsService.endpoints;
    if (endpoints && endpoints.length > 0) {
      const laymans = endpoints.filter((ep) => ep.type == 'layman');
      if (laymans.length > 0) {
        this.endpoint = laymans[0];
      } else {
        this.endpoint = endpoints[0];
      }
      if (this.endpoint && this.endpoint.type == 'layman') {
        this.endpoint.getCurrentUserIfNeeded(this.endpoint);
      }
    }
  }

  /**
   * @param endpoint
   * @param layerName
   */
  describeNewLayer(endpoint, layerName): Promise<any> {
    return new Promise((resolve, reject) => {
      this.hsLaymanService
        .describeLayer(endpoint, layerName)
        .then((descriptor) => {
          if (
            ['STARTED', 'PENDING', 'SUCCESS'].includes(descriptor.wms.status)
          ) {
            setTimeout(() => {
              this.describeNewLayer(endpoint, layerName).then((response) =>
                resolve(response)
              );
            }, 2000);
          } else {
            resolve(descriptor);
          }
        });
    });
  }

  /**
   * @function add
   * @description Handler for button click to send shape file to layman and wait for
   * answer with wms service url to add to map
   */
  add(): void {
    this.loading = true;
    if (!this.endpoint) {
      this.pickEndpoint();
    }
    this.hsAddLayersShpService
      .add(
        this.endpoint,
        this.files,
        this.name,
        this.title,
        this.abstract,
        this.srs,
        this.sld
      )
      .then((data) => {
        this.describeNewLayer(this.endpoint, this.name).then(
          (descriptor: any) => {
            this.hsAddLayersWmsService.addService(
              descriptor.wms.url,
              undefined,
              this.name
            );
            this.loading = false;
            HsLayoutService.setMainPanel('layermanager');
          }
        );
        this.resultCode = 'success';
      })
      .catch((err) => {
        this.loading = false;
        this.resultCode = 'error';
        this.errorMessage = err.message;
        this.errorDetails = err.detail;
      });
  }
}
