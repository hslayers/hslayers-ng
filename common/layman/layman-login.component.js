export default {
  template: require('./layman-login.html'),
  bindings: {
    url: '='
  },
  controller: ['$http', '$scope', 'hs.layout.service', '$compile',
    function ($http, $scope, layoutService, $compile) {
      this.modalVisible = true;
    }
  ]
};
