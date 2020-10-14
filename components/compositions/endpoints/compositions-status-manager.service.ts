import Feature from 'ol/Feature';
import {fromExtent as polygonFromExtent} from 'ol/geom/Polygon';

/**
 * @param HsStatusManagerService
 * @param HsConfig
 * @param HsUtilsService
 * @param $q
 * @param $http
 */
export default function (
  HsStatusManagerService,
  HsConfig,
  HsUtilsService,
  $q,
  $http,
  HsEventBusService
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
      let url = HsStatusManagerService.endpointUrl();
      const query = params.query;
      const textFilter =
        query && angular.isDefined(query.title) && query.title != ''
          ? '&q=' + encodeURIComponent('*' + query.title + '*')
          : '';
      url +=
        '?request=list&project=' +
        encodeURIComponent(HsConfig.project_name) +
        '&extent=' +
        bbox.join(',') +
        textFilter +
        '&start=0&limit=1000&sort=' +
        getStatusSortAttr(params.sortBy);
      url = HsUtilsService.proxify(url);
      if (angular.isDefined(me.canceler)) {
        me.canceler.resolve();
        delete me.canceler;
      }
      me.canceler = $q.defer();
      $http.get(url, {timeout: me.canceler.promise}).then(
        (response) => {
          response = response.data;
          if (angular.isUndefined(ds.compositions)) {
            ds.compositions = [];
            ds.compositionsCount = 0;
          }
          angular.forEach(response.results, (record) => {
            let found = false;
            angular.forEach(ds.compositions, (composition) => {
              if (composition.id == record.id) {
                if (angular.isDefined(record.edit)) {
                  composition.editable = record.edit;
                }
                found = true;
              }
            });
            if (!found) {
              record.editable = false;
              if (angular.isDefined(record.edit)) {
                record.editable = record.edit;
              }
              if (angular.isUndefined(record.link)) {
                record.link =
                  HsStatusManagerService.endpointUrl() +
                  '?request=load&id=' +
                  record.id;
              }
              if (angular.isUndefined(record.thumbnail)) {
                record.thumbnail =
                  HsStatusManagerService.endpointUrl() +
                  '?request=loadthumb&id=' +
                  record.id;
              }
              const attributes = {
                record: record,
                hs_notqueryable: true,
                highlighted: false,
              };
              attributes.geometry = polygonFromExtent(
                compositionParser.parseExtent(record.extent)
              );
              record.feature = new Feature(attributes);
              extentLayer.getSource().addFeatures([record.feature]);
              if (record) {
                ds.compositions.push(record);
                ds.compositionsCount = ds.compositionsCount + 1;
              }
            }
          });
        },
        (err) => {}
      );
    },
    delete(endpoint, composition) {
      let url =
        HsStatusManagerService.endpointUrl() +
        '?request=delete&id=' +
        composition.id +
        '&project=' +
        encodeURIComponent(HsConfig.project_name);
      const method = 'GET';
      url = HsUtilsService.proxify(url);
      $http({url, method}).then(
        (response) => {
          HsEventBusService.compositionDeletes.next(composition);
        },
        (err) => {}
      );
    },
  });
  return me;
}

/**
 * @param sortBy
 */
function getStatusSortAttr(sortBy) {
  const sortMap = {
    bbox: '[{"property":"bbox","direction":"ASC"}]',
    title: '[{"property":"title","direction":"ASC"}]',
    date: '[{"property":"date","direction":"ASC"}]',
  };
  return encodeURIComponent(sortMap[sortBy]);
}
