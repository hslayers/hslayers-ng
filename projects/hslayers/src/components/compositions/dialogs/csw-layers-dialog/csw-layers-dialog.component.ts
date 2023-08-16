import {Component, Input, OnInit, ViewChild, ViewRef} from '@angular/core';
import {NgbAccordion} from '@ng-bootstrap/ng-bootstrap';

import {HsAddDataOwsService} from '../../../add-data/url/add-data-ows.service';
import {HsAddDataUrlService} from '../../../add-data/url/add-data-url.service';
import {HsDialogComponent} from '../../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsDialogItem} from '../../../layout/dialogs/dialog-item';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {
  setFromComposition,
  setPath,
  setSubLayers,
  setTitle,
} from '../../../../common/layer-extensions';

@Component({
  selector: 'hs-csw-layers-dialog',
  templateUrl: './csw-layers-dialog.component.html',
  styleUrls: ['./csw-layers-dialog.component.scss'],
})
export class CswLayersDialogComponent implements OnInit, HsDialogComponent {
  dialogItem: HsDialogItem;
  viewRef: ViewRef;
  @ViewChild('acc') acc: NgbAccordion;
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
   * Determines wether all layers should be added or just the checked ones
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
    const service = this.data.services.find((s) => s.id == e.panelId);
    //Assign correct service data object to typeService
    service.typeService.data = service.data;
  }
}
