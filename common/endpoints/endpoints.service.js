/**
 * @param HsConfig
 * @param HsCommonLaymanService
 */
export default function (HsConfig, HsCommonLaymanService) {
  'ngInject';
  const me = this;

  /**
   * @param ds
   */
  function getItemsPerPageConfig(ds) {
    return angular.isDefined(ds.paging) &&
      angular.isDefined(ds.paging.itemsPerPage)
      ? ds.paging.itemsPerPage
      : HsConfig.dsPaging || 20;
  }

  angular.extend(me, {
    endpoints: [
      ...(HsConfig.status_manager_url
        ? [
            {
              type: 'statusmanager',
              title: 'Status manager',
              url: HsConfig.status_manager_url,
            },
          ]
        : []),
      ...(HsConfig.datasources || []).map((ds) => {
        return {
          url: ds.url,
          type: ds.type,
          title: ds.title,
          datasourcePaging: {
            start: 0,
            limit: getItemsPerPageConfig(ds),
            loaded: false,
          },
          compositionsPaging: {
            start: 0,
            limit: getItemsPerPageConfig(ds),
            loaded: false,
          },
          paging: {
            itemsPerPage: getItemsPerPageConfig(ds),
          },
          user: ds.user,
          liferayProtocol: ds.liferayProtocol,
          originalConfiguredUser: ds.user,
          getCurrentUserIfNeeded: HsCommonLaymanService.getCurrentUserIfNeeded,
        };
      }),
    ],
  });
  return me;
}
