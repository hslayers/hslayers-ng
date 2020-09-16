/* eslint-disable angular/timeout-service */
export default {
  template: require('./layman-current-user.html'),
  bindings: {
    endpoint: '=',
  },
  controller: function (
    $http,
    $scope,
    HsLayoutService,
    $compile,
    $location,
    HsCommonLaymanService
  ) {
    'ngInject';
    const vm = this;
    let monitorTries = 0;
    const DEFAULT_TIMER_INTERVAL = 2000;
    const MAX_MONITOR_TRIES = 100;
    let timerInterval = DEFAULT_TIMER_INTERVAL;
    angular.extend(vm, {
      isAuthorized() {
        return vm.endpoint.user == 'anonymous' || vm.endpoint.user == 'browser';
      },
      logout() {
        vm.monitorUser();
        HsCommonLaymanService.logout(vm.endpoint);
      },
      protocolsMatch() {
        return $location.protocol() == vm.endpoint.liferayProtocol;
      },
      authUrl() {
        return vm.endpoint.url + '/authn/oauth2-liferay/login';
      },
      monitorUser() {
        if (vm.getCurrentUserTimer) {
          clearTimeout(vm.getCurrentUserTimer);
        }
        monitorTries = 0;
        timerInterval = DEFAULT_TIMER_INTERVAL;
        // eslint-disable-next-line angular/interval-service
        /**
         *
         */
        function poll() {
          HsCommonLaymanService.getCurrentUser(vm.endpoint).then(
            (somethingChanged) => {
              if (somethingChanged && vm.getCurrentUserTimer) {
                clearTimeout(vm.getCurrentUserTimer);
                monitorTries = MAX_MONITOR_TRIES;
              }
            }
          );
          monitorTries++;
          if (monitorTries > MAX_MONITOR_TRIES) {
            clearTimeout(vm.getCurrentUserTimer);
          }
          vm.getCurrentUserTimer = setTimeout(poll, timerInterval);
        }
        vm.getCurrentUserTimer = setTimeout(poll, timerInterval);
      },
      login() {
        vm.monitorUser();
        if (!vm.protocolsMatch()) {
          return;
        }
        const el = angular.element(
          '<hs.layman-login url="$ctrl.authUrl()"></hs.layman-login>'
        );
        HsLayoutService.contentWrapper
          .querySelector('.hs-dialog-area')
          .appendChild(el[0]);
        $compile(el)($scope);
      },
    });
  },
};
