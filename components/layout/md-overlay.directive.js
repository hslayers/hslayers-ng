/**
 * @param HsConfig
 */
export default function (HsConfig) {
  'ngInject';
    return {
      template: HsConfig.directiveTemplates['md-overlay'] ||
		require('./partials/overlay.html'),
      link: (scope, element, attrs) => {
        element.css('height', element.parent().css('height'));
        scope.$watch(
          () => element.parent().css('height'),
          () => {
            element.css('height', element.parent().css('height'));
          }
        );
      },
    };
  }
