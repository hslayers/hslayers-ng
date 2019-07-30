export default ['config', 'hs.mickaFiltersService', 'hs.datasourceBrowserService', '$compile',
function (config, mickaFilterService, datasourceBrowserService, $compile) {
    return {
        template: require('./micka-filters.html'),
        link: function (scope, element, attrs) {
            scope.mickaFilterService = mickaFilterService;
            scope.query = datasourceBrowserService.data.query;
            scope.mickaDatasetConfig = scope.$eval(attrs['mickaDatasetConfig']);

            /**
            * @function openMickaAdvancedSearch
            * @memberOf hs.mickaFiltersDirective
            * Opens Micka Advanced Search dialog, might pass current search string.
            */
            scope.openMickaAdvancedSearch = function (mickaDatasetConfig) {
                if (document.getElementById('ds-advanced-micka') == null) {
                    var el = angular.element('<div hs.adv-micka-dialog></div>');
                    el[0].setAttribute('micka-dataset-config', JSON.stringify(mickaDatasetConfig));
                    $compile(el)(scope);
                    document.getElementById("hs-dialog-area").appendChild(el[0]);
                } else {
                    scope.modalVisible = true;
                }
                if(datasourceBrowserService.data.query.title)
                    datasourceBrowserService.data.query.textFilter = datasourceBrowserService.data.query.title;
            }

            /**
             * @function setOtnKeyword
             * @memberOf hs.mickaFiltersDirective
             * @param {String} theme Selected Otn theme keyword 
             * Select Otn Keyword as query subject (used with dropdown list in Gui)
             */
            scope.setOtnKeyword = function (theme) {
                if (theme == '-') theme = '';
                datasourceBrowserService.data.query.Subject = theme;
                datasourceBrowserService.queryCatalogs();
                return false;
            }
        }
    };
}]