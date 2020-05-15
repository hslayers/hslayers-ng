export default function () {
  'ngInject';
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      const raw = element[0];
      function resolveScrollPosition() {
        if (
          raw.classList.value.indexOf('expanded') + 1 &&
          raw.scrollHeight > raw.clientHeight
        ) {
          raw.style['touch-action'] = 'pan-y';
          if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
            raw.style['touch-action'] = 'pan-up';
          }
          if (raw.scrollTop == 0) {
            raw.style['touch-action'] = 'pan-down';
          }
        } else {
          raw.style['touch-action'] = 'none';
        }
      }
      scope.$watch(
        () => raw.scrollHeight,
        () => {
          resolveScrollPosition();
        }
      );
      scope.$watch(
        () => raw.classList.value,
        () => {
          resolveScrollPosition();
        }
      );
      element.bind('scroll', () => {
        raw.style['touch-action'] = 'pan-y';
        if (raw.scrollTop + raw.offsetHeight > raw.scrollHeight) {
          raw.style['touch-action'] = 'pan-up';
        }
        if (raw.scrollTop == 0) {
          raw.style['touch-action'] = 'pan-down';
        }
      });
    },
  };
}
