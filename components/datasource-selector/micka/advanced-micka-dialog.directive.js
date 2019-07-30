export default ['config', 'hs.mickaFiltersService', 'hs.datasourceBrowserService', '$compile',
    function (config, mickaFilterService, datasourceBrowserService, $compile) {
    return {
        template: require('./advanced-micka-dialog.html'),
        link: function (scope, element, attrs) {
            scope.modalVisible = true;

            scope.mickaFilterService = mickaFilterService;
            scope.datasourceSelectorService = datasourceBrowserService;
            scope.qaery = datasourceBrowserService.query;
            scope.mickaDatasetConfig = scope.$eval(attrs['mickaDatasetConfig']);
            
            /**
             * @function showSuggestions
             * @memberOf hs.datasource_selector
             * @param {String} input Suggestion class type name (e.g. "Organisation Name")
             * @param {String} param Suggestion paramater of Micka service (e.g. "org")
             * @param {String} field Expected property name in response object (e.g. "value")
             * Shows suggestions dialog and edits suggestion config.
             */
            scope.showSuggestions = function (input, param, field) {
                mickaFilterService.changeSuggestionConfig(input, param, field);
                if (config.design === "md") {
                    mickaFilterService.suggestionFilter = datasourceBrowserService.data.query[input];
                    mickaFilterService.suggestionFilterChanged(scope.mickaDatasetConfig);
                } else {
                    if (document.getElementById('ds-suggestions-micka') == null) {
                        var el = angular.element('<div hs.micka-suggestions-dialog></span>');
                        document.getElementById("hs-dialog-area").appendChild(el[0]);;
                        $compile(el)(scope);
                    } else {
                        scope.suggestionsModalVisible = true;
                        var filterElement = document.getElementById('ds-sug-filter');
                        mickaFilterService.suggestionFilter = scope.data.query[input];
                        filterElement.focus();                       
                    }
                    mickaFilterService.suggestionFilterChanged(scope.mickaDatasetConfig);
                }
            }

            /**
            * @function addSuggestion
            * @memberOf hs.datasourceBrowserService
            * @param {String} text Selected property value from suggestions
            * Save suggestion into Query object
            */
            scope.addSuggestion = function (text) {
                datasourceBrowserService.data.query[mickaFilterService.suggestionConfig.input] = text;
                scope.suggestionsModalVisible = false;
            }
        }
    };
}]