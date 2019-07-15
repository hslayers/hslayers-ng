export default ['config', function (config) {
    return {
        template: require('components/search/partials/searchresults.html'),
        replace: true,
        link: function (scope, element) {

        }
    };
}]