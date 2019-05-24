/**
 * @namespace hs.print
 * @memberOf hs
 */
define(['angular'],

    function (angular) {
        angular.module('hs.language', [])
            /**
             * @memberof hs.language
             * @ngdoc directive
             * @name hs.language.directive
             * @description Add print dialog template to the app
             */
            .directive('hs.language.directive', ['config', function (config) {
                return {
                    template: require(`components/language/partials/language.html`),
                };
            }])

            /**
             * @memberof hs.language
             * @ngdoc service
             * @name hs.language.service
             */
            .service('hs.language.service', ['Core', 'gettextCatalog',
                function (Core, gettextCatalog) {
                    var me = {};
                    /**
                     * @memberof hs.language.service
                     * @function setlanguage
                     * @public
                     * @params {String} lang 
                     * @description Set language
                     */
                    me.setLanguage = function (lang) {
                        Core.setLanguage(lang);
                    }

                    /**
                    * @ngdoc method
                    * @name Core#getCurrentLanguagePrefix 
                    * @public
                    * @description Get code of current language
                    */
                    me.getCurrentLanguageCode = function () {
                        if (typeof Core.language == 'undefined' || Core.language == '') return 'EN';
                        return Core.language.substr(0, 2).toUpperCase();
                    }

                    /**
                   * @ngdoc method
                   * @name Core#listAvailableLanguages 
                   * @public
                   * @description Get array of available languages based on translations.js 
                   * or translations_extended.js files which have gettextCatalog services in them
                   */
                    me.listAvailableLanguages = function () {
                        var language_code_name_map = { "en": 'English', cs: "Český", "fr_FR": 'Français', "lv_LV": 'Latviski', "nl": 'Nederlands' }
                        var langs = [{ key: "en", name: 'English' }];
                        for (key in gettextCatalog.strings) {
                            if (gettextCatalog.strings.hasOwnProperty(key)) {
                                langs.push({ key: key, name: language_code_name_map[key] });
                            }
                        }
                        return langs
                    }

                    return me;
                }])

            /**
             * @memberof hs.language
             * @ngdoc controller
             * @name hs.language.controller
             */
            .controller('hs.language.controller', ['$scope', 'hs.language.service',
                function ($scope, service) {
                    /**
                     * Set language
                     * @memberof hs.language.controller
                     * @function setLanguage 
                     * @param {string} lang
                     */
                    $scope.setLanguage = function (lang) {
                        service.setLanguage(lang);
                    }

                    $scope.getCurrentLanguageCode = service.getCurrentLanguageCode;
                    $scope.available_languages = service.listAvailableLanguages();

                    $scope.$emit('scope_loaded', "Language");
                }
            ]);
    })
