export default ['HsConfig', function (config) {
  return {
    template: require('./partials/infopanel.html')
    // templateUrl: config.infopanel_template || `${config.hsl_path}components/layout/partials/infopanel${config.design || ''}.html`,
  };
}];
