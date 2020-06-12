/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    replace: true,
    template: HsConfig.directiveTemplates["md-right-panel"] || require('./partials/right-panel.html'),
  };
}
