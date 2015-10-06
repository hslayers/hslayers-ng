wglinit = function(that) {

    var map = that.map;
    var ol = that.ol;

    var data = new DataLoader(visualize);
    data.loadPosData("bermingham_acc.json");

   

	var tlwgs=[-20037508.34,20037508.34];
    function visualize(data) {

        WGL = new WGL(data, '');

        var charts = [];
        
    	WGL.addMapDimension(data.pts, 'map');
    	WGL.addHeatMapDimension(data.pts, 'heatmap');
    	WGL.addPolyBrushFilter('map','polybrush');
		
		WGL.addExtentFilter();
		
		/* DAYES*/
		var dayes = {data: data.dayes,  min:0, max: 7, num_bins: 7,  name: 'dayes'};	
		WGL.addLinearHistDimension(dayes);
		WGL.addLinearFilter(dayes,7, 'dayesF');		
		charts['dayes'] = new StackedBarChart(dayes, "chart2", "day of the week", 'dayes');
		
		/*HOURS*/
		
		var hours = {data: data.hours,  min:0, max:24, num_bins: 24, name: 'hours'} ;
		WGL.addLinearHistDimension(hours);
		WGL.addLinearFilter(hours,24*4, 'hoursF');
		charts['hours'] = new StackedBarChart(hours, "chart3", "hour of the day", 'hours');
      
        
		map.getView().on('change:center',onMove,0);
		map.getView().on('change:resolution',onMove,0);
		map.on('moveend',onMove,0);
	
		WGL.addCharts(charts);
		WGL.initFilters();
		//WGL.render();
		onMove();
		WGL.render();	

    }




    
	var onMove = function() {
		var getTopLeftTC = function() {
		
         
		var s = Math.pow(2, map.getView().getZoom());
	//	console.log(s);
		tlpixel = map.getPixelFromCoordinate( tlwgs);
	//	console.log(tlpixel);
		res = {
			x : -tlpixel[0] / s,
			y : -tlpixel[1] / s
		}
		return res
	}

		// var timer = null;
		// if (timer != null) clearTimeout(timer);
        // timer = setTimeout(function() {
        	 WGL.mcontroller.zoommove(map.getView().getZoom(), getTopLeftTC(), WGL.filterByExt);
     	//	console.log(getTopLeftTC());
         //}, 1000);


	}
}
