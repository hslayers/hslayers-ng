wglinit = function(that) {
    var map = that.map;
    var ol = that.ol;
    mapConf(that.map, that.ol);

    var tlwgs = [-20037508.34, 20037508.34];

    setTimeout(function() {
        var data = new DataLoader(visualize);
        data.loadPosData("testdata.json");
    }, 0);

    function visualize(data) {
        WGL = new WGL(data.num, '', 'map');

        map.on('change:size', function() {
            WGL.mcontroller.manager.updateMapSize();
            WGL.mcontroller.resize();
            onMove();
        });
        var charts = [];

        var heatmap = WGL.addHeatMapDimension(data.pts, 'heatmap');

        var mapdim = WGL.addMapDimension(data.pts, 'themap');
        WGL.addColorFilter('heatmap', 'colorbrush');
        WGL.addPolyBrushFilter('themap', 'polybrush');
        var legend = new HeatMapLegend('legend', 'colorbrush');
        heatmap.addLegend(legend);

        WGL.addExtentFilter();

        var params = {
            w: 360,
            h: 210
        };
        params.margin = {
            top: 20,
            right: 20,
            bottom: 50,
            left: 55
        };

        var charts = [];

        /*SERVELITY*/
        var sev = {
            data: data.sev,
            domain: data.sevEnum,
            name: 'sev',
            type: 'ordinal',
            label: "accident servelity"
        };
        WGL.addOrdinalHistDimension(sev);
        WGL.addLinearFilter(sev, 3, 'sevF');
        charts['sev'] = new StackedBarChart(sev, "chart3", "accident severity", 'sevF');

        /* DAYS*/
        var days = {
            data: data.days,
            domain: data.daysarray,
            name: 'days',
            type: 'ordinal',
            label: "day of the week"
        };
        WGL.addOrdinalHistDimension(days);
        WGL.addLinearFilter(days, 7, 'daysF');
        charts['days'] = new StackedBarChart(days, "chart1", "day of the week", 'daysF');

        /*HOURS*/
        var hours = {
            data: data.hours,
            min: 0,
            max: 24,
            num_bins: 24,
            name: 'hours',
            type: 'linear',
            label: "hour of the day"
        };
        WGL.addLinearHistDimension(hours);
        WGL.addLinearFilter(hours, 24 * 10, 'hoursF');
        charts['hours'] = new StackedBarChart(hours, "chart2", "hour of the day", 'hoursF');

        var roadtype = {
            data: data.road_type,
            domain: data.rtDom,
            name: 'roadt',
            type: 'ordinal',
            label: "road type"
        };
        WGL.addOrdinalHistDimension(roadtype);
        WGL.addLinearFilter(roadtype, 8, 'roadtF');

        var sl = {
            data: data.speed_limit,
            domain: ['20', '30', '40', '50', '60', '70'],
            name: 'speedlimit',
            type: 'ordinal',
            label: "Speed limit"
        };
        WGL.addOrdinalHistDimension(sl);
        WGL.addLinearFilter(sl, 13, 'slF');
        charts['speedlimit'] = new StackedBarChart(sl, "chart5", "Speed limit", 'slF');

        var d = [];
        d[0] = hours;
        d[1] = days;
        d[2] = roadtype;
        d[3] = sl;
        d[4] = sev;

        /**
         * Addin all charts
         */
        WGL.addCharts(charts);

        WGL.initFilters();

        var radius = 12.;

        WGL.getDimensions()['heatmap'].radiusFunction = function(z) {
            var res = radius * Math.pow(2, z) / 5000;
            //console.log(res);
            return res;
        };

        map.getView().on('change:center', onMove, 0);
        map.getView().on('change:resolution', onMove, 0);
        map.on('moveend', onMove, 0);
        WGL.addCharts(charts);
        WGL.initFilters();
        //onMove();
        WGL.the_map = map;
        WGL.mcontroller.zoommove(map.getView().getZoom(), getTopLeftTC());
    }

    var onMove = function() {
        WGL.mcontroller.zoommove(map.getView().getZoom(), getTopLeftTC(), WGL.filterByExt);
    }

    var getTopLeftTC = function() {
        var s = Math.pow(2, map.getView().getZoom());
        tlpixel = map.getPixelFromCoordinate(tlwgs);
        res = {
            x: -tlpixel[0] / s,
            y: -tlpixel[1] / s
        }
        return res
    }
}
