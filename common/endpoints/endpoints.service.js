export default ['config', 'hs.common.laymanService', function (config, laymanService) {
  const me = this;
  angular.extend(me, {
    endpoints: [
      {
        type: 'statusmanager',
        title: 'Status manager',
        url: config.status_manager_url
      },
      ...(config.datasources || []).map(ds => {
        return {
          url: ds.url,
          type: ds.type,
          title: ds.title,
          start: 0,
          limit: 20,
          user: ds.user,
          originalConfiguredUser: ds.user,
          getCurrentUserIfNeeded: laymanService.getCurrentUserIfNeeded
        };
      })
    ]
  });
  return me;
}];
