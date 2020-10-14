/**
 * @param HsCompositionsStatusManagerService
 * @param HsCompositionsMickaService
 * @param HsCompositionsMapService
 * @param HsCompositionsParserService
 */
export default function (
  HsCompositionsStatusManagerService,
  HsCompositionsMickaService,
  HsCompositionsMapService,
  HsCompositionsParserService
) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    /**
     * @ngdoc method
     * @name HsCompositionsService#loadList
     * @public
     * @description Load list of compositions according to current
     * filter values and pager position (filter, keywords, current
     * extent, start composition, compositions number per page).
     * Display compositions extent in map. Loops through the existing
     * list of compositions, and when a composition is
     * found in statusmanagers list, then it becomes editable.
     * @param ds
     * @param params
     * @param bbox
     */
    loadList(ds, params, bbox) {
      return new Promise((resolve, reject) => {
        HsCompositionsMickaService.loadList(
          ds,
          params,
          bbox,
          HsCompositionsMapService.extentLayer
        ).then(() => {
          HsCompositionsStatusManagerService.loadList(ds, params, bbox);
          resolve();
        });
      });
    },
    getInfo(composition) {
      return new Promise((resolve, reject) => {
        const url = composition.link;
        HsCompositionsParserService.loadInfo(url, (info) => {
          info.thumbnail = composition.thumbnail;
          resolve(info);
        });
      });
    },
    delete(endpoint, composition) {
      HsCompositionsStatusManagerService(endpoint, composition);
    },
  });
  return me;
}
