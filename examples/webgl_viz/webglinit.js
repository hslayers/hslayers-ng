wglinit = function(that) {
    var map = that.map;
    var ol = that.ol;
    mapConf(that.map, that.ol);

    var data = new DataLoader(visualize);
    data.loadPosData("birmingham_acc.json");
    var tlwgs = [-20037508.34, 20037508.34];

    function visualize(data) {

        WGL = new WGL(data.num, '', 'map');

        map.on('change:size', function() {
            WGL.mcontroller.manager.updateMapSize();
            WGL.mcontroller.resize();
            onMove();
        });
        var charts = [];

        WGL.addHeatMapDimension(data.pts, 'heatmap');
        WGL.addMapDimension(data.pts, 'themap');
        WGL.addPolyBrushFilter('themap', 'polybrush');


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


        /** Histogram for days*/
        var days = {
            data: data.days,
            domain: data.daysarray,
            name: 'days',
            type: 'ordinal'
        };
        WGL.addOrdinalHistDimension(days);
        WGL.addLinearFilter(days, 7, 'daysF');
        charts['days'] = new StackedBarChart(days, "chart1", "day of the week", "daysF", params);

        /** Histogram for severity */
        var sev = {
            data: data.sev,
            domain: ['1', '2', '3'],
            name: 'sev',
            type: 'ordinal'
        };
        WGL.addOrdinalHistDimension(sev);
        WGL.addLinearFilter(sev, 3, 'sevF');
        charts['sev'] = new StackedBarChart(sev, "chart3", "accident servelity", "sevF", params);


        /** Histogram for hours*/
        var hours = {
            data: data.hours,
            min: 0,
            max: 24,
            num_bins: 24,
            name: 'hours',
            type: 'linear'
        };
        WGL.addLinearHistDimension(hours);
        WGL.addLinearFilter(hours, 24 * 10, 'hoursF');
        charts['hours'] = new StackedBarChart(hours, "chart2", "hour of the day", "hoursF", params);



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
