import Feature from 'ol/Feature';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';

/**
 * @param $rootScope
 * @param HsCompositionsParserService
 * @param $q
 * @param $http
 * @param HsMapService
 * @param HsUtilsService
 */
export default function (
  $rootScope,
  HsCompositionsParserService,
  $q,
  $http,
  HsMapService,
  HsUtilsService
) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    getCompositionsQueryUrl(endpoint, params, bbox) {
      const query = params.query;
      const bboxDelimiter =
        endpoint.url.indexOf('cswClientRun.php') > 0 ? ',' : ' ';
      const serviceName = angular.isDefined(endpoint.serviceName)
        ? 'serviceName=&' + endpoint.serviceName
        : '';
      bbox = params.filterExtent
        ? encodeURIComponent(" and BBOX='" + bbox.join(bboxDelimiter) + "'")
        : '';
      const textFilter =
        query && angular.isDefined(query.title) && query.title != ''
          ? encodeURIComponent(
              " AND title like '*" +
                query.title +
                "*' OR abstract like '*" +
                query.title +
                "*'"
            )
          : '';
      const selected = [];
      let keywordFilter = '';
      let tmp = endpoint.url;
      angular.forEach(params.keywords, (value, key) => {
        if (value) {
          selected.push("subject='" + key + "'");
        }
      });
      if (selected.length > 0) {
        keywordFilter = encodeURIComponent(
          ' AND (' + selected.join(' OR ') + ')'
        );
      }

      tmp +=
        '?format=json&' +
        serviceName +
        'query=type%3Dapplication' +
        bbox +
        textFilter +
        keywordFilter +
        '&lang=eng&sortBy=' +
        params.sortBy +
        '&detail=summary&start=' +
        params.start +
        '&limit=' +
        params.limit;
      tmp = HsUtilsService.proxify(tmp);
      return tmp;
    },

    loadList(endpoint, params, bbox, extentLayer) {
      endpoint.compositionsPaging.loaded = false;
      if (angular.isUndefined(params.sortBy)) {
        params.sortBy = 'title';
      }
      if (angular.isUndefined(params.start)) {
        params.start = endpoint.compositionsPaging.start;
      }
      if (angular.isUndefined(params.limit) || isNaN(params.limit)) {
        params.limit = endpoint.compositionsPaging.limit;
      }
      return new Promise((resolve, reject) => {
        if (angular.isDefined(me.canceler)) {
          me.canceler.resolve();
          delete me.canceler;
        }
        me.canceler = $q.defer();
        $http
          .get(me.getCompositionsQueryUrl(endpoint, params, bbox), {
            timeout: me.canceler.promise,
          })
          .then(
            (response) => {
              endpoint.compositionsPaging.loaded = true;
              response = response.data;
              endpoint.compositions = response.records;
              if (response.records && response.records.length > 0) {
                endpoint.compositionsPaging.compositionsCount =
                  response.matched;
              } else {
                endpoint.compositionsPaging.compositionsCount = 0;
              }
              //TODO: Needs refactoring
              endpoint.compositionsPaging.next = response.next;
              const mapExtent = HsMapService.getMapExtent();
              angular.forEach(endpoint.compositions, (record) => {
                const attributes = {
                  record: record,
                  hs_notqueryable: true,
                  highlighted: false,
                  title: record.title || record.name,
                };
                record.editable = false;
                record.endpoint = endpoint;
                if (angular.isUndefined(record.thumbnail)) {
                  record.thumbnail =
                    endpoint.url + '?request=loadthumb&id=' + record.id;
                }
                const extent = HsCompositionsParserService.parseExtent(
                  record.bbox
                );
                //Check if height or Width covers the whole screen
                if (
                  !(
                    (extent[0] < mapExtent[0] && extent[2] > mapExtent[2]) ||
                    (extent[1] < mapExtent[1] && extent[3] > mapExtent[3])
                  )
                ) {
                  attributes.geometry = polygonFromExtent(extent);
                  attributes.is_hs_composition_extent = true;
                  const newFeature = new Feature(attributes);
                  record.feature = newFeature;
                  extentLayer.getSource().addFeatures([newFeature]);
                } else {
                  //Composition not in extent
                }
              });
              $rootScope.$broadcast('CompositionsLoaded');
              resolve();
            },
            (err) => {}
          );
      });
    },

    resetCompositionCounter(endpoint) {
      endpoint.compositionsPaging.start = 0;
      endpoint.compositionsPaging.next = endpoint.compositionsPaging.limit;
    },
  });
  return me;
}
