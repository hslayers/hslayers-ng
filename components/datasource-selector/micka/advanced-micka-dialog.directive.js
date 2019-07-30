export default ['config', 'hs.datasourceMickaFilterService', 'hs.datasource_selector.service', '$compile',
    function (config, mickaFilterService, datasourceSelectorService, $compile) {
    return {
        template: require('components/datasource-selector/micka/dialog_micka_advanced.html'),
        link: function (scope, element, attrs) {
            scope.modalVisible = true;

            scope.mickaFilterService = mickaFilterService;
            scope.datasourceSelectorService = datasourceSelectorService;
            scope.qaery = datasourceSelectorService.query;
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
                    mickaFilterService.suggestionFilter = datasourceSelectorService.data.query[input];
                    mickaFilterService.suggestionFilterChanged(scope.mickaDatasetConfig);
                } else {
                    if (document.getElementById('ds-suggestions-micka') == null) {
                        var el = angular.element('<div hs.datasource_selector.suggestions_dialog_directive></span>');
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
            * @memberOf hs.datasource_selector.service
            * @param {String} text Selected property value from suggestions
            * Save suggestion into Query object
            */
            scope.addSuggestion = function (text) {
                datasourceSelectorService.data.query[mickaFilterService.suggestionConfig.input] = text;
                scope.suggestionsModalVisible = false;
            }
        }
    };
}]