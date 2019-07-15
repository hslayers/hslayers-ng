export default ['$timeout', function ($timeout) {
    var me = {};
    return angular.extend(me, {

        /**
         * @memberof hs.print.service
         * @function print
         * @public
         * @params {String} title 
         * @description Basic print implementation
         */
        print: function (title) {
            var canvas = canvas = document.getElementsByTagName("canvas")[0];
            var img = canvas.toDataURL("image/png");
            var win = window.open();
            var html = "<html><head></head><body><h2>" + title + "</h2><br><img src='" + img + "'/></body></html>";
            win.document.write(html);
            $timeout(function () {
                win.print();
                //win.location.reload();
            }, 250);
        }

    })
}]