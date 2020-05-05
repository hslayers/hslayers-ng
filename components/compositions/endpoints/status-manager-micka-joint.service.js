export default [
  'hs.compositions.statusManagerService',
  'hs.compositions.mickaService',
  'hs.compositions.mapService',
  'hs.compositions.service_parser',
  function (
    compositionsStatusManagerService,
    mickaEndpointService,
    mapService,
    compositionParser
  ) {
    const me = this;
    angular.extend(me, {
      /**
       * @ngdoc method
       * @name hs.compositions.service#loadList
       * @public
       * @description Load list of compositions according to current
       * filter values and pager position (filter, keywords, current
       * extent, start composition, compositions number per page).
       * Display compositions extent in map. Loops through the existing
       * list of compositions, and when a composition is
       * found in statusmanagers list, then it becomes editable.
       */
      loadList(ds, params, bbox) {
        return new Promise((resolve, reject) => {
          mickaEndpointService
            .loadList(ds, params, bbox, mapService.extentLayer)
            .then(() => {
              compositionsStatusManagerService.loadList(ds, params, bbox);
              resolve();
            });
        });
      },
      getInfo(composition) {
        return new Promise((resolve, reject) => {
          const url = composition.link;
          compositionParser.loadInfo(url, (info) => {
            info.thumbnail = composition.thumbnail;
            resolve(info);
          });
        });
      },
      delete(endpoint, composition) {
        compositionsStatusManagerService(endpoint, composition);
      },
    });
    return me;
  },
];
