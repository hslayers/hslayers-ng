export default [
  '$timeout',
  'hs.map.service',
  '$window',
  function ($timeout, hsMap, $window) {
    const me = {};
    return angular.extend(me, {
      /**
       * @memberof hs.print.service
       * @function print
       * @public
       * @param {String} title Heading of printed page
       * @description Basic print implementation
       */
      print(title) {
        const canvas = hsMap.getCanvas();
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
  },
];
