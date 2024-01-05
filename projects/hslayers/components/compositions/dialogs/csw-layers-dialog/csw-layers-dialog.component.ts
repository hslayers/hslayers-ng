import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {HsAddDataOwsService} from 'hslayers-ng/shared/add-data';
import {HsAddDataUrlService} from 'hslayers-ng/shared/add-data';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDialogItem} from 'hslayers-ng/common/dialogs';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {
  setFromComposition,
  setPath,
  setSubLayers,
  setTitle,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-csw-layers-dialog',
  templateUrl: './csw-layers-dialog.component.html',
  styleUrls: ['./csw-layers-dialog.component.scss'],
})
export class CswLayersDialogComponent implements OnInit, HsDialogComponent {
  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  @Input() data: any;
  servicesLoaded = false;
  layersString: string;
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataOwsService: HsAddDataOwsService,
    public hsUtilsService: HsUtilsService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsMapService: HsMapService,
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve(false);
  }

  async ngOnInit(): Promise<void> {
    if (this.data.layers) {
      this.layersString = this.data.layers.map((l) => l.title).join(', ');
    }
    for (const service of this.data.services) {
      this.hsAddDataUrlService.typeSelected = service.type;
      await this.hsAddDataOwsService.setUrlAndConnect({
        type: service.type,
        uri: service.url,
        getOnly: true,
      });
      service.typeService = this.hsAddDataOwsService.typeService;
      const data = service.typeService?.data;
      if (data?.layers?.length > 0) {
        //Store data object outside service so it can be reassigned later
        service.data = Object.assign({}, service.typeService.data);
        service.loaded = true;
      } else {
        //TODO: Toast error?
        this.removeService(service);
      }
    }
    this.servicesLoaded = this.data.services.every((s) => s.loaded);
  }

  /**
   * Determines whether all layers should be added or just the checked ones
   */
  lookForChecked(layers): boolean {
    for (const lyr of layers) {
      if (lyr.checked) {
        return true;
      }
      if (lyr.Layer) {
        if (this.lookForChecked(lyr.Layer)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Sets additional layer params
   */
  setLayerParams(layers, service, checkedOnly) {
    for (const layer of layers) {
      setFromComposition(layer, true);
      setPath(layer, service.title);
      if (this.hsLayerUtilsService.isLayerWMS(layer) && !checkedOnly) {
        setSubLayers(
          layer,
          layers.map((l) => l.getSource().getParams().LAYERS).join(','),
        );
        setTitle(layer, service.title);
        layer.set('serviceLayer', true);
        return [layer];
      }
    }
    return layers;
  }

  /**
   * Creates service layers and adds them to the map
   */
  addLayers(): void {
    this.hsMapService.removeCompositionLayers(true);
    for (const service of this.data.services) {
      const checkedOnly = this.lookForChecked(service.data.layers);
      service.typeService.data = service.data;
      let layers = service.typeService.getLayers(checkedOnly, !checkedOnly);
      layers = this.setLayerParams(layers, service, checkedOnly);
      service.typeService.addLayers(layers);
    }
    this.HsDialogContainerService.destroy(this);
    this.dialogItem.resolve(true);
  }

  /**
   * Removes service from CSW composition
   */
  removeService(service): void {
    this.data.services = this.data.services.filter((s) => s != service);
  }

  /**
   * Assigns per service data to the input addData-urlType service when switching between different services (many times of same type)
   */
  beforeChange(e): void {
    const service = this.data.services.find((s) => s.id == e);
    //Assign correct service data object to typeService
    service.typeService.data = service.data;
    service.selected = true;
  }
}
