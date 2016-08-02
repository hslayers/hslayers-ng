/**
 * @namespace hs.mobile_settings
 * @memberOf hs
 */
define(['angular', 'core'],

    function(angular) {
        angular.module('hs.mobile_settings', ['hs.core'])
            .directive('hs.mobileSettings.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/mobile_settings/partials/mobile_settings.html?bust=' + gitsha
                };
            })

        .controller('hs.mobile_settings.controller', ['$scope', 'config', 'Core', 'hs.map.service', '$window',
            function($scope, config, Core, OlMap, $window) {
                $scope.Core = Core;
                configDebug = config;
                $scope.settingsDb = settingsDb;
                $scope.originalHostnames = $.extend( {}, config.hostname);
                $scope.hostnames = config.hostname;

                $scope.addHostname = function() {
                    if ($scope.userHostname) {
                        config.hostname["user"] = {
                            "title": "User hostname",
                            "type": "user",
                            "editable": true,
                            "url": $scope.userHostname
                        };
                        settingsDb.transaction(function(tx){
                            tx.executeSql('REPLACE INTO Hostnames VALUES (?,?,?,?)', [config.hostname.user.title, config.hostname.user.type, config.hostname.user.editable, config.hostname.user.url], function(tx, result){
                                $scope.userHostname = "";
                                console.log(result.insertId);
                            });
                        });
                    }
                }

                $scope.deleteHostname = function() {
                    delete $scope.hostnames[this.hostname.type];
                    $scope.deleteRow(settingsDb, this.hostname.type);
                }

                $scope.preFill = function() {
                    $scope.userHostname = !$scope.userHostname ? "http://" : $scope.userHostname;
                }

                $scope.removePreFill = function() {
                    $scope.userHostname = $scope.userHostname == "http://" ? "" : $scope.userHostname;
                }

                $scope.initSettings = function(db) {
                    console.log("Populating hostnames database.");
                    console.log($scope.hostnames);
                    console.log(config.hostname);
                    console.log(settingsDb);
                    config.hostname = $.extend( {}, $scope.originalHostnames);
                    $scope.hostnames = config.hostname;

                    db.transaction(function(tx){
                        tx.executeSql('DROP TABLE IF EXISTS Hostnames', [], console.log("Dropping hostnames table."));
                        tx.executeSql('CREATE TABLE IF NOT EXISTS Hostnames (title unique, type, editable, url)', [], console.log("Creating hostnames table."));
                        $.each($scope.hostnames, function(key, value) {
                            tx.executeSql('INSERT INTO Hostnames VALUES (?,?,?,?)', [value.title, value.type, value.editable, value.url]);
                        });
                    });
                }

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

                $scope.deleteRow = function(db, type) {
                    db.transaction(function(tx) {
                        tx.executeSql('DELETE FROM Hostnames WHERE type = ?', [type]);
                    });
                }

                settingsDb.transaction($scope.loadSettingsFromDb, function(error){
                    console.log(error);
                    $scope.initSettings(settingsDb);
                    console.log("Loading initial settings.");
                }, function() {
                    if (Object.keys(dbHostnames)[0]) {
                        config.hostname = dbHostnames;
                        $scope.hostnames = config.hostname;
                        console.log("Loading settings from memory.");
                    }
                });

                $scope.$on('scope_loaded', function() {
                    // $("#loading-logo")[0].removeChild($("svg")[0]);
                    $("#loading-logo").remove();
                });

                $scope.$emit('scope_loaded', "Mobile Settings");
            }

        ]);
    })
