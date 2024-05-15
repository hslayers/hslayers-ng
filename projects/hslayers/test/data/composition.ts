export const compositionJson = {
  endpoint: {type: 'layman'},
  'abstract': '',
  'title': 'Housing availability',
  'user': {'email': 'none@none'},
  'groups': {'guest': 'r'},
  'scale': 1,
  'projection': 'epsg:3857',
  'center': [2831309.671235698, 7822190.932631157],
  'units': 'm',
  'layers': [
    {
      'metadata': {},
      'visibility': true,
      'opacity': 1,
      'title': 'Measurement sketches',
      'className': 'Vector',
      'features': '{"type":"FeatureCollection","features":[]}',
      'maxResolution': null,
      'minResolution': 0,
      'projection': 'epsg:4326',
      'style': {
        'fill': 'rgba(255, 255, 255, 0.2)',
        'stroke': {'color': '#ffcc33', 'width': 2},
      },
    },
    {
      'metadata': {},
      'visibility': true,
      'opacity': 1,
      'title': 'Position',
      'className': 'Vector',
      'features':
        '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[14.265108804908085,50.03457546855486]},"properties":{"known":false}},{"type":"Feature","geometry":{"type":"GeometryCollection","geometries":[]},"properties":{"known":false}}]}',
      'maxResolution': null,
      'minResolution': 0,
      'projection': 'epsg:4326',
    },
    {
      'metadata': {},
      'visibility': true,
      'opacity': 1,
      'title': 'Measurement sketches',
      'className': 'Vector',
      'features': '{"type":"FeatureCollection","features":[]}',
      'maxResolution': null,
      'minResolution': 0,
      'projection': 'epsg:4326',
      'style': {
        'fill': 'rgba(255, 255, 255, 0.2)',
        'stroke': {'color': '#ffcc33', 'width': 2},
      },
    },
    {
      'metadata': {},
      'visibility': true,
      'opacity': 1,
      'title': 'Point clicked - features as string',
      'className': 'Vector',
      'features':
        '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":[25.486272576058198,57.21506027419332]},"properties":null}]}',
      'maxResolution': null,
      'minResolution': 0,
      'projection': 'epsg:4326',
    },
    {
      'metadata': {},
      'visibility': true,
      'opacity': 1,
      'title': 'Json features',
      'className': 'Vector',
      'features': {
        'type': 'FeatureCollection',
        'features': [
          {
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': [25.486272576058198, 57.21506027419332],
            },
            'properties': null,
          },
        ],
      },
      'maxResolution': null,
      'minResolution': 0,
      'projection': 'epsg:4326',
    },
    {
      'metadata': {},
      'visibility': true,
      'opacity': 1,
      'title': 'Vector layer without features',
      'className': 'Vector',
      'maxResolution': null,
      'minResolution': 0,
      'projection': 'epsg:4326',
      'style':
        'http://localhost:8087/rest/workspaces/filip/layers/jtsk_geojson/style',
    },
  ],
  'current_base_layer': {'title': 'Open street map'},
};