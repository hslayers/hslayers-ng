export default {
  template: require('./layman-current-user.html'),
  bindings: {
    endpoint: '='
  },
  controller: ['$http', '$scope', 'hs.layout.service', '$compile', '$location', 'hs.common.laymanService',
    function ($http, $scope, layoutService, $compile, $location, laymanService) {
      const vm = this;
      angular.extend(vm, {
        isAuthorized() {
          return vm.endpoint.user == 'anonymous' || vm.endpoint.user == 'browser';
        },
        logout() {
          const url = `${vm.endpoint.url}/authn/logout`;
          vm.monitorUser();
          $http.get(url)
            .then(
              (res) => {
                vm.endpoint.user = 'anonymous';
              });
        },
        protocolsMatch() {
          return $location.protocol() == vm.endpoint.liferayProtocol;
        },
        authUrl() {
          return vm.endpoint.url + '/authn/oauth2-liferay/login';
        },
        monitorUser() {
          if (vm.getCurrentUserTime) {
            clearInterval(vm.getCurrentUserTime);
          }
          // eslint-disable-next-line angular/interval-service
          vm.getCurrentUserTimer = setInterval(()=> {
            laymanService.getCurrentUser(vm.endpoint);
          }, 2000);
        },
        login() {
          vm.monitorUser();
          if (!vm.protocolsMatch()) {
            return;
          }
          const el = angular.element('<hs.layman-login url="$ctrl.authUrl()"></hs.layman-login>');
          layoutService.contentWrapper.querySelector('.hs-dialog-area')
            .appendChild(el[0]);
          $compile(el)($scope);
        }
      });
    }
  ]
};
