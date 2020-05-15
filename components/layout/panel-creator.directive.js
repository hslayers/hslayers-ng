/**
 * @param $compile
 * @param $parse
 */
export default function ($compile, $parse) {
  'ngInject';
  return {
    restrict: 'A',
    terminal: true,
    priority: 100000,
    link: function (scope, elem) {
      const name = $parse(elem.attr('panel-creator'))(scope);
      elem.removeAttr('panel-creator');
      const dirname = $parse(elem.attr('directive'))(scope);
      if (name) {
        elem.attr('ng-controller', name);
        elem.attr(dirname, '');
        $compile(elem)(scope);
      } else {
        const html = angular.element('<' + dirname + '> </' + dirname + '>');
        html.attr('ng-show', elem.attr('ng-show'));
        elem.append($compile(html)(scope));
      }
    },
  };
}
