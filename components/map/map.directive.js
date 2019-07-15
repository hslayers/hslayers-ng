export default ['config', '$compile', function (config, $compile) {
    return {
        template: require('components/map/partials/map.html'),
        link: function (scope, element, attrs, ctrl) {
            var el = document.getElementsByClassName('ol-zoomslider');
            if (el.length > 0) {
                el[0].style.width = 28 + 'px';
                el[0].style.height = 200 + 'px';
            }
        }
    };
}]