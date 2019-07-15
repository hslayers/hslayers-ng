export default ['config', function (config) {
    return {
        template: require('components/search/partials/searchinput.html'),
        replace: true,
        link: function (scope, element) {

        }
    };
    /**
     * @memberof hs.search
     * @ngdoc directive
     * @name hs.search.directiveSearchresults
     * @description Add search results template to page
     */
}]