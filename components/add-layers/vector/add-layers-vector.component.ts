export const HsAddLayersVectorComponent = {
  template: require('./add-vector-layer.directive.html'),
  constroller: [
    'HsAddLayersVectorService',
    'HsLayoutService',
    function (service, layoutService) {
      const vm = this;
      vm.srs = 'EPSG:4326';
      vm.title = '';
      vm.extract_styles = false;

      /**
       * Handler for adding nonwms service, file in template.
       * @memberof hs.addLayersVector.controller
       * @function add
       */
      vm.add = async function () {
        const layer = await service.addVectorLayer(
          '',
          vm.url,
          vm.title,
          vm.abstract,
          vm.srs,
          {extractStyles: vm.extract_styles}
        );
        service.fitExtent(layer);
        layoutService.setMainPanel('layermanager');
        return layer;
      };
    },
  ],
};
