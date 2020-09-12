export default {
  template: require('./draw-layer-metadata.html'),
  bindings: {
    layer: '<',
  },
  controller: function (
    $scope,
    $timeout,
    HsDrawService,
    HsMapService,
    HsCommonEndpointsService
  ) {
    'ngInject';
    this.modalVisible = true;
    const vm = this;
    $scope.$on('datasource-selector.layman_auth', (endpoint) => {
      vm.endpoint = endpoint;
    });
    $timeout(() => {
      vm.title = $scope.$ctrl.layer.get('title');
      vm.path = $scope.$ctrl.layer.get('path');

      if (HsCommonEndpointsService.endpoints.length > 0) {
        for (const endpoint of HsCommonEndpointsService.endpoints) {
          if ((endpoint.type = 'layman')) {
            vm.endpoint = endpoint;
          }
        }
      }
    }, 0);
    angular.extend(vm, {
      endpoint: {
        user: 'browser',
      },
      newLayerPath: '',
      attributes: [],

      isAuthorized() {
        return vm.endpoint.user == 'anonymous' || vm.endpoint.user == 'browser';
      },
      titleChanged() {
        vm.layer.set('title', vm.title);
      },
      confirm() {
        const dic = {};

        const tmpLayer = HsMapService.findLayerByTitle('tmpDrawLayer') || null;
        if (tmpLayer) {
          HsMapService.map.removeLayer(tmpLayer);
        }

        vm.attributes.forEach((a) => {
          dic[a.name] = a.value;
        });
        let editorConfig = vm.layer.get('editor');
        if (angular.isUndefined(editorConfig)) {
          editorConfig = {};
          vm.layer.set('editor', editorConfig);
        }
        editorConfig.defaultAttributes = dic;

        vm.layer.getSource().forEachFeature((f) => {
          f.setProperties(dic);
        });

        HsDrawService.changeDrawSource();
        HsDrawService.addDrawLayer(vm.layer);
        HsDrawService.fillDrawableLayers();

        vm.layer.set('synchronize', true);
        vm.awaitLayerSync(vm.layer).then(() => {
          vm.layer.getSource().dispatchEvent('addfeature');
        });

        vm.modalVisible = false;
        HsDrawService.tmpDrawLayer = false;
      },
      cancel() {
        HsDrawService.selectedLayer = HsDrawService.previouslySelected;
        vm.modalVisible = false;
      },

      async awaitLayerSync(layer) {
        while (layer.get('hs-layman-synchronizing')) {
          await new Promise((r) => setTimeout(r, 200));
        }
        return true;
      },
      pathChanged() {
        vm.layer.set('path', vm.path);
      },
      addAttr() {
        vm.attributes.push({id: Math.random(), name: '', value: ''});
      },
    });
  },
};
