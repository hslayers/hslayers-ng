/**
 * @param $timeout
 * @param HsMapService
 * @param $window
 */
export default function ($timeout, HsMapService, $window) {
  'ngInject';
  const me = {};
  return angular.extend(me, {
    /**
     * @memberof HsPrintService
     * @function print
     * @public
     * @param {string} title Heading of printed page
     * @description Basic print implementation
     */
    print(title) {
      const canvas = HsMapService.getCanvas();
      const img = canvas.toDataURL('image/png');
      const win = $window.open();
      const html = `<html><head></head><body><h2>${title}</h2><br><img src='${img}'/></body></html>`;
      win.document.write(html);
      $timeout(() => {
        win.print();
        //win.location.reload();
      }, 250);
    },
  });
}
