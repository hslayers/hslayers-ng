import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {HsAddLayersVectorService} from './vector/add-layers-vector.service';
import {HsConfig} from '../../config.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsStatusManagerService} from '../save-map/status-manager.service';

import {DragAndDrop} from 'ol/interaction';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from 'ol/format';

@Injectable({providedIn: 'root'})
export class HsDragDropLayerService {
  constructor(
    private httpClient: HttpClient,
    private hsAddLayersVectorService: HsAddLayersVectorService,
    public hsConfig: HsConfig,
    private hsLog: HsLogService,
    private hsMapService: HsMapService,
    private hsStatusManagerService: HsStatusManagerService
  ) {
    const dragAndDrop = new DragAndDrop({
      formatConstructors: [GPX, GeoJSON, IGC, KML, TopoJSON],
    });

    this.hsMapService.loaded().then((map) => {
      map.addInteraction(dragAndDrop);
    });
    dragAndDrop.on('addfeatures', async (event) => {
      if (event.features.length > 0) {
        const f = new GeoJSON();
        //TODO Saving to statusmanager should probably be done with statusmanager component throught events
        let url = '';
        try {
          url = this.hsStatusManagerService.endpointUrl();
        } catch (ex) {
          //Disregard error
        }
        const options = {
          features: event.features,
        };
        try {
          const response: any = await this.httpClient
            .post(
              url,
              JSON.stringify({
                project: this.hsConfig.project_name,
                title: event.file.name,
                request: 'saveData',
                dataType: 'json',
                data: f.writeFeatures(event.features, {
                  dataProjection: 'EPSG:4326',
                  featureProjection: this.hsMapService.map
                    .getView()
                    .getProjection()
                    .getCode(),
                }),
              })
            )
            .toPromise();

          const data = {
            url: `${url}?request=loadData&id=${response.data.id}`,
            title: event.file.name,
            projection: event.projection,
          };
          const layer = await this.hsAddLayersVectorService.addVectorLayer(
            'geojson',
            decodeURIComponent(data.url),
            data.title || 'Layer',
            '',
            data.projection,
            options
          );
          this.hsAddLayersVectorService.fitExtent(layer);
        } catch (e) {
          this.hsLog.warn(e);
          const data = {
            title: event.file.name,
            projection: event.projection,
          };
          const layer = await this.hsAddLayersVectorService.addVectorLayer(
            '',
            undefined,
            data.title || 'Layer',
            '',
            data.projection,
            options
          );
          this.hsAddLayersVectorService.fitExtent(layer);
        }
      }
    });
  }
}
