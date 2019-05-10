/**
 * @namespace hs.mobile_settings
 * @memberOf hs
 */
define(['angular', 'core'],

    function(angular) {
        angular.module('hs.mobile_settings', ['hs.core'])
            /**
            * @memberof hs.mobile_settings
            * @ngdoc directive
            * @name hs.mobileSettings.directive
            * @description TODO
            */
            .directive('hs.mobileSettings.directive', ['config', function (config) {
                return {
                    template: require('components/mobile_settings/partials/mobile_settings.html'
                };
            }])

        /**
        * @memberof hs.mobile_settings
        * @ngdoc controller
        * @name hs.mobile_settings.controller
        * @description TODO
        */
        .controller('hs.mobile_settings.controller', ['$scope', 'config', 'Core', 'hs.map.service', '$window',
            function($scope, config, Core, OlMap, $window) {
                $scope.Core = Core;
                configDebug = config;
                $scope.settingsDb = settingsDb;
                $scope.originalHostnames = $.extend({}, config.hostname);
                $scope.hostnames = config.hostnames;
                config.hostname["default"] = config.hostnames[0];
                $scope.selectedHostname = config.hostnames[0].title;

                /**
                 * @function addHostname
                 * @memberOf hs.mobile_settings.controller
                 * @description TODO
                 */
                $scope.addHostname = function() {
                    if ($scope.userHostname) {
                        config.hostname["user"] = {
                            "title": "User hostname",
                            "type": "user",
                            "editable": true,
                            "url": $scope.userHostname
                        };
                        settingsDb.transaction(function(tx) {
                            tx.executeSql('REPLACE INTO Hostnames VALUES (?,?,?,?)', [config.hostname.user.title, config.hostname.user.type, config.hostname.user.editable, config.hostname.user.url], function(tx, result) {
                                $scope.userHostname = "";
                                console.log(result.insertId);
                            });
                        });
                    }
                }

                $scope.changeHostname = function() {
                    console.log(this, $scope.hostname);
                    angular.forEach($scope.hostnames, function(hostname){
                        if ($scope.selectedHostname == hostname.title) {
                            config.hostname[hostname.type] = hostname;
                        }
                    });
                }

                /**
                 * @function deleteHostname
                 * @memberOf hs.mobile_settings.controller
                 * @description TODO
                 */
                $scope.deleteHostname = function() {
                    delete $scope.hostname[this.hostname.type];
                    $scope.deleteRow(settingsDb, this.hostname.type);
                }

                /**
                 * @function preFill
                 * @memberOf hs.mobile_settings.controller
                 * @description TODO
                 */
                $scope.preFill = function() {
                    $scope.userHostname = !$scope.userHostname ? "http://" : $scope.userHostname;
                }

                /**
                 * @function removePreFill
                 * @memberOf hs.mobile_settings.controller
                 * @description TODO
                 */
                $scope.removePreFill = function() {
                    $scope.userHostname = $scope.userHostname == "http://" ? "" : $scope.userHostname;
                }

                /**
                 * @function initSettings
                 * @memberOf hs.mobile_settings.controller
                 * @params {Unknown} db
                 * @description TODO
                 */
                $scope.initSettings = function(db) {
                    if (console) {
                        console.log("Populating hostnames database.");
                        console.log($scope.hostname);
                        console.log(config.hostname);
                        console.log(settingsDb);
                        // config.hostname = $.extend({}, $scope.originalHostnames);
                    }
                    $scope.hostname = config.hostname;

                    db.transaction(function(tx) {
                        tx.executeSql('DROP TABLE IF EXISTS Hostnames', [], console.log("Dropping hostnames table."));
                        tx.executeSql('CREATE TABLE IF NOT EXISTS Hostnames (title unique, type, editable, url)', [], console.log("Creating hostnames table."));
                        $.each($scope.hostname, function(key, value) {
                            tx.executeSql('INSERT INTO Hostnames VALUES (?,?,?,?)', [value.title, value.type, value.editable, value.url]);
                        });
                    }, function() {
                        //TODO Error
                    });
                }

                /**
                 * @function loadSettingsFromDb
                 * @memberOf hs.mobile_settings.controller
                 * @params {unknown} tx
                 * @description TODO
                 */
                $scope.loadSettingsFromDb = function(tx) {
                    dbHostnames = {};
                    tx.executeSql('SELECT * FROM Hostnames', [], function(tx, results) {
                        // console.log(results.rows.length + ' rows found.');
                        for (var i = 0; i < results.rows.length; i++) {
                            // console.log(results.rows.item(i));
                            dbHostnames[results.rows.item(i).type] = {
                                "title": results.rows.item(i).title,
                                "type": results.rows.item(i).type,
                                "editable": JSON.parse(results.rows.item(i).editable),
                                "url": results.rows.item(i).url
                            }
                        }
                    });
                }

                /**
                 * @function deleteRow
                 * @memberOf hs.mobile_settings.controller
                 * @params {Unknown} db
                 * @params {Unknown} type
                 * @description TODO
                 */
                $scope.deleteRow = function(db, type) {
                    db.transaction(function(tx) {
                        tx.executeSql('DELETE FROM Hostnames WHERE type = ?', [type]);
                    });
                }

                settingsDb.transaction($scope.loadSettingsFromDb, function(error) {
                    console.log(error);
                    $scope.initSettings(settingsDb);
                    console.log("Loading initial settings.");
                }, function() {
                    if (Object.keys(dbHostnames)[0]) {
                        config.hostname = dbHostnames;
                        $scope.hostname = config.hostname;
                        console.log("Loading settings from memory.");
                    }
                });

                function removeLoadingLogo(){
                    var el = document.getElementById('hs-loading-logo');
                    if(el) {
                        el.parentElement.removeChild(el);
                        $timeout.cancel(logoRemoverTimeout);
                    }
                }

                $scope.$on('scope_loaded', removeLoadingLogo);

                $scope.$emit('scope_loaded', "Mobile Settings");
            }

        ]);
    })
