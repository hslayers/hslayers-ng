/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
  return {
    template: require(`./partials/feature-list-md.html`),
    link: function (scope, element) {},
  };
}
