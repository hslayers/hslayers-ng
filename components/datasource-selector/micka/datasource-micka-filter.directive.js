export default ['config', 'hs.datasourceMickaFilterService', 'hs.datasource_selector.service', '$compile',
function (config, mickaFilterService, datasourceSelectorService, $compile) {
    return {
        template: require('components/datasource-selector/micka/micka-filter.html'),
        link: function (scope, element, attrs) {
            scope.mickaFilterService = mickaFilterService;
            scope.query = datasourceSelectorService.data.query;
            scope.mickaDatasetConfig = scope.$eval(attrs['mickaDatasetConfig']);

            /**
            * @function openMickaAdvancedSearch
            * @memberOf hs.datasource_selector
            * Opens Micka Advanced Search dialog, might pass current search string.
            */
            scope.openMickaAdvancedSearch = function (mickaDatasetConfig) {
                if (document.getElementById('ds-advanced-micka') == null) {
                    var el = angular.element('<div hs.datasource_selector.advanced_micka_dialog_directive></div>');
                    el[0].setAttribute('micka-dataset-config', JSON.stringify(mickaDatasetConfig));
                    $compile(el)(scope);
                    document.getElementById("hs-dialog-area").appendChild(el[0]);
                } else {
                    scope.modalVisible = true;
                }
                if(datasourceSelectorService.data.query.title)
                    datasourceSelectorService.data.query.textFilter = datasourceSelectorService.data.query.title;
            }

            /**
             * @function setOtnKeyword
             * @memberOf hs.datasource_selector
             * @param {String} theme Selected Otn theme keyword 
             * Select Otn Keyword as query subject (used with dropdown list in Gui)
             */
            scope.setOtnKeyword = function (theme) {
                if (theme == '-') theme = '';
                datasourceSelectorService.data.query.Subject = theme;
                datasourceSelectorService.loadDatasets();
                return false;
            }
        }
    };
}]