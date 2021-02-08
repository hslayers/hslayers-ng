import * as xml2Json from 'xml-js';

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
        const compLinks = composition.link || composition.links;
        if (compLinks === undefined) {
          return;
        }
        let url;
        const compUrls = this.getCompositionUrls(compLinks);
        if (Array.isArray(compUrls)) {
          url = compUrls[0];
        } else {
          url = compUrls;
        }

        HsCompositionsParserService.loadInfo(url, (info) => {
          // info.thumbnail = composition.thumbnail;
          const infoDetails = {};

          if (url.endsWith('wmc')) {
            const caps = xml2Json.xml2js(info, {compact: true});
            infoDetails.abstract = caps.ViewContext.General.Abstract._text;
            infoDetails.url = url;
            infoDetails.title = caps.ViewContext.General.Title._text;
            infoDetails.layers = caps.ViewContext.LayerList.Layer;
            if (infoDetails.layers) {
              infoDetails.layers.forEach((layer) => {
                layer.title = layer.Title._text;
              });
            }
            console.log(caps);
          }

          resolve(infoDetails);
        });
      });
    },
    delete(endpoint, composition) {
      HsCompositionsStatusManagerService(endpoint, composition);
    },

    getCompositionUrls(compData) {
      if (typeof compData == 'string') {
        return compData;
      }
      if (typeof compData == 'object' && compData.url !== undefined) {
        return compData.url;
      }
      return compData.map((link) =>
        typeof link == 'object' && link.url !== undefined ? link.url : link
      );
    },
  });
  return me;
}
