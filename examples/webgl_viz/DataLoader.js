function DataLoader(visualize) {
    var that = this;

    /**
     * Load text file
     */
    $("#speed_chart").text("Please wait... data are being loaded. This may take a while.");

    this.loadPosData = function(file) {

        var pts = [];
        var dayes = [];
        var hours = [];
        var sev = [];

        var j = 0;
        /**
         * load data
         */
        d3.csv(file, function(error, data) {

            data.forEach(function(val, i) {

                pts[j++] = parseFloat(val.x);
                pts[j++] = parseFloat(val.y);

                //index[i] = rasterer.calc(i);	
                var d = (new Date(val.timestamp * 1000));
                //index[i] = rasterer.calc(i);	
                dayes[i] = d.getDay();

                hours[i] = d.getHours() + d.getMinutes() / 60;
                sev[i] = val.accident_severity;

            });

            visualize({
                pts: pts,
                dayes: dayes,
                hours: hours,
                sev: sev,
                num: data.length
            });
        });
    }
}
