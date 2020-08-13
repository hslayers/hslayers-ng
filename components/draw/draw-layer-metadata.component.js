export default {
  template: require('./draw-layer-metadata.html'),
  bindings: {
    layer: '<',
  },
  controller: function ($scope, $timeout, HsDrawService, HsMapService) {
    'ngInject';
    this.modalVisible = true;
    const vm = this;
    $timeout(() => {
      vm.title = $scope.$ctrl.layer.get('title');
      vm.path = $scope.$ctrl.layer.get('path');
    }, 0);
    angular.extend(vm, {
      newLayerPath: '',
      attributes: [],
      titleChanged() {
        vm.layer.set('title', vm.title);
      },
      confirm() {
        const dic = {};

        let tmpLayer = HsMapService.findLayerByTitle('tmpDrawLayer') || null;
        if (tmpLayer) {
          HsMapService.map.removeLayer(tmpLayer)  
        }

        vm.attributes.forEach((a) => {dic[a.name] = a.value});
        let editorConfig = vm.layer.get('editor');
        if (angular.isUndefined(editorConfig)) {
          editorConfig = {};
          vm.layer.set('editor', editorConfig);
        }
        editorConfig.defaultAttributes = dic;

        vm.layer.getSource().forEachFeature((f) => {
          f.setProperties(dic);
        })
          
        HsDrawService.changeDrawSource();
       
        vm.layer.set('synchronize',true);
        HsDrawService.addDrawLayer(vm.layer);
        HsDrawService.fillDrawableLayers();
        vm.modalVisible = false;
        HsDrawService.tmpDrawLayer = false;
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
