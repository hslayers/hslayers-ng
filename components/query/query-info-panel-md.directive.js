/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template:
      HsConfig.directiveTemplates['query-info-panel-md'] ||
      require('./partials/infopanelmd.html'),
    // templateUrl: config.infopanel_template || `${config.hsl_path}components/layout/partials/infopanel${config.design || ''}.html`,
  };
}
