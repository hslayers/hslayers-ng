import BaseLayer from 'ol/layer/Base';
import {Component, OnInit} from '@angular/core';

import {FileDescriptor} from './file-descriptor.type';
import {HsAddLayersShpService} from './add-layers-shp.service';
import {HsAddLayersWmsService} from '../wms/add-layers-wms.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLaymanLayerDescriptor} from '../../save-map/layman-layer-descriptor.interface';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsUtilsService} from '../../utils/utils.service';

@Component({
  selector: 'hs-add-layers-shp',
  templateUrl: './add-shp-layer.directive.html',
})
export class HsAddLayersShpComponent implements OnInit {
  abstract: string;
  endpoint: HsEndpoint = null;
  errorDetails = [];
  errorMessage: any;
  extract_styles = false;
  files: FileDescriptor[] = [];
  loading: boolean;
  name: string;
  resultCode: string;
  sld: FileDescriptor = null;
  srs = 'EPSG:4326';
  title = '';
  folder_name = '';
  advancedPanelVisible = false;
  addUnder: BaseLayer = null;

  constructor(
    public hsAddLayersShpService: HsAddLayersShpService,
    public hsLayoutService: HsLayoutService,
    public hsLaymanService: HsLaymanService,
    public hsLog: HsLogService,
    public hsAddLayersWmsService: HsAddLayersWmsService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsUtilsService: HsUtilsService
  ) {}

  ngOnInit(): void {
    this.pickEndpoint();
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
   * @param endpoint Selected endpoint (should be Layman)
   * @param layerName Name of the layer to describe
   * @returns {Promise} Description of Layman layer
   */
  async describeNewLayer(
    endpoint: HsEndpoint,
    layerName: string
  ): Promise<HsLaymanLayerDescriptor> {
    try {
      const descriptor = await this.hsLaymanService.describeLayer(
        endpoint,
        layerName
      );
      if (['STARTED', 'PENDING', 'SUCCESS'].includes(descriptor.wms.status)) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.describeNewLayer(endpoint, layerName));
          }, 2000);
        });
      } else {
        return descriptor;
      }
    } catch (ex) {
      this.hsLog.error(ex);
      throw ex;
    }
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
        this.name = data[0].name; //Name translated to Layman-safe name
        return this.describeNewLayer(this.endpoint, this.name);
      })
      .then((descriptor) => {
        this.resultCode = 'success';
        this.hsAddLayersWmsService.addService(
          descriptor.wms.url,
          undefined,
          this.name,
          undefined,
          this.hsUtilsService.undefineEmptyString(this.folder_name)
        );
        this.loading = false;
        this.hsLayoutService.setMainPanel('layermanager');
      })
      .catch((err) => {
        this.hsLog.error(err);
        this.loading = false;
        this.resultCode = 'error';
        this.errorMessage = err?.error?.message ?? err?.message;
        this.errorDetails = err?.error?.detail
          ? Object.entries(err.error.detail)
          : [];
      });
  }

  read(evt): void {
    const filesRead = [];
    for (const file of evt.target.files) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        filesRead.push({
          name: file.name,
          type: file.type,
          content: loadEvent.target.result,
        });
      };
      reader.readAsArrayBuffer(file);
    }
    if (evt.target.id === 'sld') {
      this.sld = filesRead[0];
    } else {
      this.files = filesRead;
    }
    console.log(this.files);
    console.log(this.sld);
  }
}
