/**
 * @param HsAddLayersShpService
 * @param HsLayoutService
 * @param HsLaymanService
 * @param HsAddLayersWmsAddLayerService
 * @param $timeout
 * @param HsCommonEndpointsService
 * @param $scope
 */
export default function (
  HsAddLayersShpService,
  HsLayoutService,
  HsLaymanService,
  HsAddLayersWmsAddLayerService,
  $timeout,
  HsCommonEndpointsService,
  $scope
) {
  'ngInject';
  const vm = this;
  vm.srs = 'EPSG:4326';
  vm.title = '';
  vm.extract_styles = false;
  vm.files = null;
  vm.sld = null;
  vm.errorDetails = {};
  vm.endpoint = null;
  vm.loaderImage = require('../../../img/ajax-loader.gif');

  vm.endpointsService = HsCommonEndpointsService;

  $scope.$watch(
    () => {
      return HsCommonEndpointsService.endpoints;
    },
    (value) => {
      if (value && vm.endpoint === null && value.length > 0) {
        const laymans = value.filter((ep) => ep.type == 'layman');
        if (laymans.length > 0) {
          vm.endpoint = laymans[0];
        } else {
          vm.endpoint = value[0];
        }
        if (vm.endpoint && vm.endpoint.type == 'layman') {
          vm.endpoint.getCurrentUserIfNeeded(vm.endpoint);
        }
      }
    }
  );

  /**
   * @param endpoint
   * @param layerName
   */
  function describeNewLayer(endpoint, layerName) {
    return new Promise((resolve, reject) => {
      HsLaymanService.describeLayer(endpoint, layerName).then((descriptor) => {
        if (
          ['STARTED', 'PENDING', 'SUCCESS'].indexOf(descriptor.wms.status) > -1
        ) {
          $timeout(() => {
            describeNewLayer(endpoint, layerName).then((response) =>
              resolve(response)
            );
          }, 2000);
        } else {
          resolve(descriptor);
        }
      });
    });
  }

  /**
   * Handler for button click to send shape file to layman and wait for
   * answer with wms service url to add to map
   *
   * @memberof HsAddLayersShpController
   * @function add
   */
  vm.add = function () {
    vm.loading = true;
    HsAddLayersShpService.add(
      vm.endpoint,
      vm.files,
      vm.name,
      vm.title,
      vm.abstract,
      vm.srs,
      vm.sld
    )
      .then((data) => {
        describeNewLayer(vm.endpoint, vm.name).then((descriptor) => {
          HsAddLayersWmsAddLayerService.addService(
            descriptor.wms.url,
            undefined,
            vm.name
          );
          vm.loading = false;
          HsLayoutService.setMainPanel('layermanager');
        });
        vm.resultCode = 'success';
      })
      .catch((err) => {
        vm.loading = false;
        vm.resultCode = 'error';
        vm.errorMessage = err.message;
        vm.errorDetails = err.detail;
      });
  };
}
