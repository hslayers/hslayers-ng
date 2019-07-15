export default ['$compile', '$parse', function ($compile, $parse) {
    return {
        restrict: 'A',
        terminal: true,
        priority: 100000,
        link: function (scope, elem) {
            var name = $parse(elem.attr('panel-creator'))(scope);
            elem.removeAttr('panel-creator');
            var dirname = $parse(elem.attr('directive'))(scope);
            if (name) {
                elem.attr('ng-controller', name);
                elem.attr(dirname, '');
                $compile(elem)(scope);
            } else {
                var html = angular.element('<' + dirname + '> </' + dirname + '>');
                html.attr('ng-show', elem.attr('ng-show'));
                elem.append($compile(html)(scope));
            }
        }
    };
}]