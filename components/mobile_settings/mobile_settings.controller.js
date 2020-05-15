/**
 * @param $scope
 * @param HsConfig
 * @param HsCore
 */
export default function ($scope, HsConfig, HsCore) {
  'ngInject';
  $scope.HsCore = HsCore;
  configDebug = HsConfig;
  $scope.settingsDb = settingsDb;
  $scope.originalHostnames = $.extend({}, HsConfig.hostname);
  $scope.hostnames = HsConfig.hostnames;
  HsConfig.hostname['default'] = HsConfig.hostnames[0];
  $scope.selectedHostname = HsConfig.hostnames[0].title;

  /**
   * @function addHostname
   * @memberOf hs.mobile_settings.controller
   * @description TODO
   */
  $scope.addHostname = function () {
    if ($scope.userHostname) {
      HsConfig.hostname['user'] = {
        'title': 'User hostname',
        'type': 'user',
        'editable': true,
        'url': $scope.userHostname,
      };
      settingsDb.transaction((tx) => {
        tx.executeSql(
          'REPLACE INTO Hostnames VALUES (?,?,?,?)',
          [
            HsConfig.hostname.user.title,
            HsConfig.hostname.user.type,
            HsConfig.hostname.user.editable,
            HsConfig.hostname.user.url,
          ],
          (tx, result) => {
            $scope.userHostname = '';
            console.log(result.insertId);
          }
        );
      });
    }
  };

  $scope.changeHostname = function () {
    console.log(this, $scope.hostname);
    angular.forEach($scope.hostnames, (hostname) => {
      if ($scope.selectedHostname == hostname.title) {
        HsConfig.hostname[hostname.type] = hostname;
      }
    });
  };

  /**
   * @function deleteHostname
   * @memberOf hs.mobile_settings.controller
   * @description TODO
   */
  $scope.deleteHostname = function () {
    delete $scope.hostname[this.hostname.type];
    $scope.deleteRow(settingsDb, this.hostname.type);
  };

  /**
   * @function preFill
   * @memberOf hs.mobile_settings.controller
   * @description TODO
   */
  $scope.preFill = function () {
    $scope.userHostname = !$scope.userHostname
      ? 'http://'
      : $scope.userHostname;
  };

  /**
   * @function removePreFill
   * @memberOf hs.mobile_settings.controller
   * @description TODO
   */
  $scope.removePreFill = function () {
    $scope.userHostname =
      $scope.userHostname == 'http://' ? '' : $scope.userHostname;
  };

  /**
   * @function initSettings
   * @memberOf hs.mobile_settings.controller
   * @params {Unknown} db
   * @description TODO
   * @param db
   */
  $scope.initSettings = function (db) {
    if (console) {
      console.log('Populating hostnames database.');
      console.log($scope.hostname);
      console.log(HsConfig.hostname);
      console.log(settingsDb);
      // config.hostname = $.extend({}, $scope.originalHostnames);
    }
    $scope.hostname = HsConfig.hostname;

    db.transaction(
      (tx) => {
        tx.executeSql(
          'DROP TABLE IF EXISTS Hostnames',
          [],
          console.log('Dropping hostnames table.')
        );
        tx.executeSql(
          'CREATE TABLE IF NOT EXISTS Hostnames (title unique, type, editable, url)',
          [],
          console.log('Creating hostnames table.')
        );
        $.each($scope.hostname, (key, value) => {
          tx.executeSql('INSERT INTO Hostnames VALUES (?,?,?,?)', [
            value.title,
            value.type,
            value.editable,
            value.url,
          ]);
        });
      },
      () => {
        //TODO Error
      }
    );
  };

  /**
   * @function loadSettingsFromDb
   * @memberOf hs.mobile_settings.controller
   * @params {unknown} tx
   * @description TODO
   * @param tx
   */
  $scope.loadSettingsFromDb = function (tx) {
    dbHostnames = {};
    tx.executeSql('SELECT * FROM Hostnames', [], (tx, results) => {
      // console.log(results.rows.length + ' rows found.');
      for (let i = 0; i < results.rows.length; i++) {
        // console.log(results.rows.item(i));
        dbHostnames[results.rows.item(i).type] = {
          'title': results.rows.item(i).title,
          'type': results.rows.item(i).type,
          'editable': JSON.parse(results.rows.item(i).editable),
          'url': results.rows.item(i).url,
        };
      }
    });
  };

  /**
   * @function deleteRow
   * @memberOf hs.mobile_settings.controller
   * @params {Unknown} db
   * @params {Unknown} type
   * @description TODO
   * @param db
   * @param type
   */
  $scope.deleteRow = function (db, type) {
    db.transaction((tx) => {
      tx.executeSql('DELETE FROM Hostnames WHERE type = ?', [type]);
    });
  };

  settingsDb.transaction(
    $scope.loadSettingsFromDb,
    (error) => {
      console.log(error);
      $scope.initSettings(settingsDb);
      console.log('Loading initial settings.');
    },
    () => {
      if (Object.keys(dbHostnames)[0]) {
        HsConfig.hostname = dbHostnames;
        $scope.hostname = HsConfig.hostname;
        console.log('Loading settings from memory.');
      }
    }
  );

  /**
   *
   */
  function removeLoadingLogo() {
    const el = document.getElementById('hs-loading-logo');
    if (el) {
      el.parentElement.removeChild(el);
      $timeout.cancel(logoRemoverTimeout);
    }
  }

  $scope.$on('scope_loaded', removeLoadingLogo);

  $scope.$emit('scope_loaded', 'Mobile Settings');
}
