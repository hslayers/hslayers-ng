/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    replace: true,
    template:
      HsConfig.directiveTemplates['feature-list'] ||
      require(`./partials/feature-list-md.html`),
    link: function (scope, element) {},
  };
}
