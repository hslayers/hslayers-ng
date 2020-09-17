import {DragAndDrop} from 'ol/interaction';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from 'ol/format';

/**
 * @param HsMapService
 * @param HsStatusManagerService
 * @param $http
 * @param HsConfig
 * @param $log
 * @param HsAddLayersVectorService
 */
export default function (
  HsMapService,
  HsStatusManagerService,
  $http,
  HsConfig,
  $log,
  HsAddLayersVectorService
) {
  'ngInject';
  const me = {};

  const dragAndDrop = new DragAndDrop({
    formatConstructors: [GPX, GeoJSON, IGC, KML, TopoJSON],
  });

  HsMapService.loaded().then((map) => {
    map.addInteraction(dragAndDrop);
  });
  dragAndDrop.on('addfeatures', async (event) => {
    if (event.features.length > 0) {
      const f = new GeoJSON();
      //TODO Saving to statusmanager should probably be done with statusmanager component throught events
      let url = '';
      try {
        url = HsStatusManagerService.endpointUrl();
      } catch (ex) {
        //Disregard error
      }
      const options = {};
      options.features = event.features;
      try {
        const response = await $http({
          url: url,
          method: 'POST',
          data: JSON.stringify({
            project: HsConfig.project_name,
            title: event.file.name,
            request: 'saveData',
            dataType: 'json',
            data: f.writeFeatures(event.features, {
              dataProjection: 'EPSG:4326',
              featureProjection: HsMapService.map
                .getView()
                .getProjection()
                .getCode(),
            }),
          }),
        });

        const data = {};
        data.url = url + '?request=loadData&id=' + response.data.id;
        data.title = event.file.name;
        data.projection = event.projection;
        const layer = await HsAddLayersVectorService.addVectorLayer(
          'geojson',
          decodeURIComponent(data.url),
          data.title || 'Layer',
          '',
          data.projection,
          options
        );
        HsAddLayersVectorService.fitExtent(layer);
      } catch (e) {
        $log.warn(e);
        const data = {};
        data.title = event.file.name;
        data.projection = event.projection;
        const layer = await HsAddLayersVectorService.addVectorLayer(
          '',
          undefined,
          data.title || 'Layer',
          '',
          data.projection,
          options
        );
        HsAddLayersVectorService.fitExtent(layer);
      }
    }
  });
  return me;
}
