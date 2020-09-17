/**
 * @param $http
 */
export default function ($http) {
  'ngInject';
  const me = this;

  /**
   * Load nonwms OWS data and create layer
   *
   * @memberof hs.addLayers
   * @function add
   * @param {object} endpoint Layman endpoint description (url, name, user)
   * @param {Array} files Array of shp files (shp, dbf, shx)
   * @param {string} name Name of new layer
   * @param {string} title Title of new layer
   * @param {string} abstract Abstract of new layer
   * @param {string} srs EPSG code of selected projection (eg. "EPSG:4326")
   * @param {Array} sld Array of sld files
   */
  me.add = function (endpoint, files, name, title, abstract, srs, sld) {
    return new Promise((resolve, reject) => {
      const formdata = new FormData();
      files.forEach((file) => {
        formdata.append(
          'file',
          new Blob([file.content], {type: file.type}),
          file.name
        );
      });
      if (sld) {
        sld.forEach((file) => {
          formdata.append(
            'sld',
            new Blob([file.content], {type: file.type}),
            file.name
          );
        });
      }
      formdata.append('name', name);
      formdata.append('title', title);
      formdata.append('abstract', abstract);
      formdata.append('crs', srs);
      $http({
        url: `${endpoint.url}/rest/${endpoint.user}/layers?${Math.random()}`,
        method: 'POST',
        data: formdata,
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined},
      }).then(
        (response) => {
          if (response.data && response.data.length > 0) {
            resolve(response.data);
          } else {
            reject(response.data);
          }
        },
        (err) => {
          reject(err.data);
        }
      );
    });
  };
  return me;
}
