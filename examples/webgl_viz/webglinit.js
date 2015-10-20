wglinit = function(that) {
    var map = that.map;
    var ol = that.ol;
    mapConf(that.map, that.ol);
    
    var data = new DataLoader(visualize);
    data.loadPosData("birmingham_acc.json");
    var tlwgs = [-20037508.34, 20037508.34];

    function visualize(data) {

        WGL = new WGL(data, '');

        map.on('change:size', function() {
            WGL.mcontroller.manager.updateMapSize();
            WGL.mcontroller.resize();
            onMove();
        });
        var charts = [];

        WGL.addMapDimension(data.pts, 'map');
        WGL.addHeatMapDimension(data.pts, 'heatmap');
        WGL.addPolyBrushFilter('map', 'polybrush');

        WGL.addExtentFilter();

        /* DAYS*/
        var days = {
            data: data.days,
            min: 0,
            max: 7,
            num_bins: 7,
            name: 'days'
        };
        WGL.addLinearHistDimension(days);
        WGL.addLinearFilter(days, 7, 'daysF');
        charts['days'] = new StackedBarChart(days, "chart2", "day of the week", 'days');

        /*HOURS*/

        var hours = {
            data: data.hours,
            min: 0,
            max: 24,
            num_bins: 24,
            name: 'hours'
        };
        WGL.addLinearHistDimension(hours);
        WGL.addLinearFilter(hours, 24 * 4, 'hoursF');
        charts['hours'] = new StackedBarChart(hours, "chart3", "hour of the day", 'hours');

        map.getView().on('change:center', onMove, 0);
        map.getView().on('change:resolution', onMove, 0);
        map.on('moveend', onMove, 0);

        WGL.addCharts(charts);
        WGL.initFilters();
        onMove();
        WGL.render();
    }

    var onMove = function() {
        var getTopLeftTC = function() {
            var s = Math.pow(2, map.getView().getZoom());
            tlpixel = map.getPixelFromCoordinate(tlwgs);
            res = {
                x: -tlpixel[0] / s,
                y: -tlpixel[1] / s
            }
            return res
        }
        WGL.mcontroller.zoommove(map.getView().getZoom(), getTopLeftTC(), WGL.filterByExt);
    }
}
