import {DragAndDrop} from 'ol/interaction';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from 'ol/format';
import {HsAddLayersVectorService} from './vector/add-layers-vector.service';
import {HsConfig} from '../../config.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsStatusManagerService} from '../save-map/status-manager.service';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class HsDragDropLayerService {
  map: any;
  constructor(
    public hsAddLayersVectorService: HsAddLayersVectorService,
    public hsConfig: HsConfig,
    public hsLog: HsLogService,
    public hsMapService: HsMapService,
    public hsStatusManagerService: HsStatusManagerService
  ) {
    const dragAndDrop = new DragAndDrop({
      formatConstructors: [GPX, GeoJSON, IGC, KML, TopoJSON],
    });

    this.hsMapService.loaded().then((map) => {
      this.map = map;
      map.addInteraction(dragAndDrop);
    });
    dragAndDrop.on('addfeatures', async (event) => {
      if (event.features.length > 0) {
        const options = {
          features: event.features,
        };
        const data = {
          title: event.file.name,
          projection: event.projection,
        };
        const layer = await this.hsAddLayersVectorService.addVectorLayer(
          '',
          undefined,
          data.title || 'Layer', //name
          data.title || 'Layer',
          '',
          data.projection,
          options
        );
        this.hsAddLayersVectorService.fitExtent(layer);
      }
    });
  }
}
