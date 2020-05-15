/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require(`./partials/feature-filter-md.html`),
    link: function (scope, element) {},
  };
}
