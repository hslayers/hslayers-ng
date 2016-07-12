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

        .controller('hs.mobile_settings.controller', ['$scope', 'config', 'Core', '$window',
            function($scope, config, Core, $window) {
                $scope.Core = Core;
                $scope.hostnames = config.hostname;
                $scope.addHostname = function() {
                    if ($scope.userHostname) {
                        $scope.hostnames["user"] = {
                            "title": "User hostname",
                            "type": "user",
                            "editable": true,
                            "url": $scope.userHostname
                        };
                        settingsDb.transaction(function(tx) {
                            tx.executeSql('REPLACE INTO Hostnames VALUES (?,?,?,?)', [$scope.hostnames.user.title, $scope.hostnames.user.type, $scope.hostnames.user.editable, $scope.hostnames.user.url], function(tx, result) {
                                console.log(result.insertId);
                            });
                            $scope.userHostname = "";
                        });
                    }
                }

                // $scope.settingsDb = window.sqlitePlugin.openDatabase({name: 'settings.db', location: 'default'}, function(){
                //     $scope.initSettings();
                // });

                $scope.delete = function() {
                    delete $scope.hostnames[this.hostname.type];
                    $scope.deleteRow(settingsDb, this.hostname.type);
                }

                $scope.preFill = function() {
                    $scope.userHostname = !$scope.userHostname ? "http://" : $scope.userHostname;
                }

                $scope.removePreFill = function() {
                    $scope.userHostname = $scope.userHostname == "http://" ? "" : $scope.userHostname;
                }

                initSettings = function(tx) {
                    console.log("Populating hostnames database.");
                    console.log($scope.hostnames);
                    console.log(config.hostname);

                    tx.transaction(function(tx) {
                        tx.executeSql('DROP TABLE IF EXISTS Hostnames', [], console.log("Dropping hostnames table."));
                        tx.executeSql('CREATE TABLE IF NOT EXISTS Hostnames (title unique, type, editable, url)', [], console.log("Creating hostnames table."));
                        $.each($scope.hostnames, function(key, value) {
                            tx.executeSql('INSERT INTO Hostnames VALUES (?,?,?,?)', [value.title, value.type, value.editable, value.url]);
                        });
                    });

                    $scope.hostnames = $.extend({}, config.hostname);
                }

                loadSettingsFromDb = function(tx) {
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

                // console.log(loadSettingsFromDb(settingsDb));

                settingsDb.transaction(loadSettingsFromDb, function(error) {
                    console.log(error);
                    initSettings(settingsDb);
                    console.log("Loading initial settings.");
                }, function() {
                    if (Object.keys(dbHostnames)[0]) {
                        $scope.hostnames = dbHostnames;
                        console.log("Loading settings from memory.");
                    }
                });

                $scope.$emit('scope_loaded', "Mobile Settings");
            }

        ]);
    })
