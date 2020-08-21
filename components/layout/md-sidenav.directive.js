/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template:
      HsConfig.directiveTemplates['md-sidenav'] ||
      require('./partials/sidenav.html'),
  };
}
