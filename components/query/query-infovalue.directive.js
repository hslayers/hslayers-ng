export default ['$compile', function ($compile) {
    function link(scope, element, attrs) {
        if (attrs.attribute == 'hstemplate') return;
        if (attrs.template) {
            var el = angular.element('<span ' + attrs.template + '></span>');
            el.attr({
                attribute: attrs.attribute,
                value: attrs.value
            });
            element.append(el);
            $compile(el)(scope);
        } else {
            if (attrs.value) {
                if (attrs.value.indexOf('http') == 0) {
                    var el = angular.element('<a>');
                    el.attr({
                        target: '_blank',
                        href: attrs.value
                    });
                    el.html(attrs.value);
                    element.html(el);
                } else {
                    element.html(attrs.value);
                }
            } else {
                element.html(attrs.attribute);
            }
        }
    }

    return {
        link: link
    };
}]