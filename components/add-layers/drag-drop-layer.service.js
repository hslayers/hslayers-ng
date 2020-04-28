import {DragAndDrop} from 'ol/interaction';
import {GPX, GeoJSON, IGC, KML, TopoJSON} from 'ol/format';

export default [
  'hs.map.service',
  'hs.statusManagerService',
  '$http',
  'config',
  '$log',
  'hs.addLayersVector.service',
  function (
    hsMap,
    statusManagerService,
    $http,
    config,
    $log,
    addLayersVectorService
  ) {
    const me = {};

    const dragAndDrop = new DragAndDrop({
      formatConstructors: [GPX, GeoJSON, IGC, KML, TopoJSON],
    });

    hsMap.loaded().then((map) => {
      map.addInteraction(dragAndDrop);
    });

    dragAndDrop.on('addfeatures', (event) => {
      if (event.features.length > 0) {
        const f = new GeoJSON();
        //TODO Saving to statusmanager should probably be done with statusmanager component throught events
        let url = '';
        try {
          url = statusManagerService.endpointUrl();
        } catch (ex) {
          //Disregard error
        }
        const options = {};
        options.features = event.features;

        $http({
          url: url,
          method: 'POST',
          data: angular.toJson({
            project: config.project_name,
            title: event.file.name,
            request: 'saveData',
            dataType: 'json',
            data: f.writeFeatures(event.features, {
              dataProjection: 'EPSG:4326',
              featureProjection: hsMap.map.getView().getProjection().getCode(),
            }),
          }),
        }).then(
          (response) => {
            const data = {};
            data.url = url + '?request=loadData&id=' + response.data.id;
            data.title = event.file.name;
            data.projection = event.projection;
            addLayersVectorService.add(
              'geojson',
              decodeURIComponent(data.url),
              data.title || 'Layer',
              '',
              true,
              data.projection,
              options
            );
          },
          (e) => {
            $log.warn(e);
            const data = {};
            data.title = event.file.name;
            data.projection = event.projection;
            addLayersVectorService.add(
              'geojson',
              undefined,
              data.title || 'Layer',
              '',
              true,
              data.projection,
              options
            );
          }
        );
      }
    });
    return me;
  },
];
