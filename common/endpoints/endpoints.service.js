export default [
  'config',
  'hs.common.laymanService',
  function (config, laymanService) {
    const me = this;

    function getItemsPerPageConfig(ds) {
      return angular.isDefined(ds.paging) &&
        angular.isDefined(ds.paging.itemsPerPage)
        ? ds.paging.itemsPerPage
        : config.dsPaging || 20;
    }

    angular.extend(me, {
      endpoints: [
        ...(config.status_manager_url
          ? [
              {
                type: 'statusmanager',
                title: 'Status manager',
                url: config.status_manager_url,
              },
            ]
          : []),
        ...(config.datasources || []).map((ds) => {
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
            getCurrentUserIfNeeded: laymanService.getCurrentUserIfNeeded,
          };
        }),
      ],
    });
    return me;
  },
];
