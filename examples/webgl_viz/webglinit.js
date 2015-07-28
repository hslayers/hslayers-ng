wglinit = function(that){

	var map = that.map;
	var ol = that.ol;

	var data = new DataLoader(visualize);
	data.loadPosData("../../../data/acc_snap3k.json");

	var tlwgs=[-20037508.34,20037508.34];

	function visualize(data){

		WGL = new WGL(data.num,'');		

	
		WGL.addMapDimension(data.pts, 'map');
	
		/*for ordinal dimension from 1-3 use range 0.5-3.5*/
		var sev   = {data: data.sev,   type:'ordinal', domain: ['1','2','3'] ,  name: 'sev'  };
		var dayes = {data: data.dayes, type:'linear', min:0, max: 7, num_bins: 7,  name: 'dayes'};
		var hours = {data: data.hours, type:'linear', min:0, max:24, num_bins: 24, name: 'hours'} 
		WGL.addHistogramDimension(sev);
		WGL.addHistogramDimension(dayes);
		WGL.addHistogramDimension(hours);
		WGL.initHistograms();
				
		charts = [];
		charts['sev'] = new StackedBarChart(sev, "chart1", "accident servelity",'sev');
		charts['dayes'] = new StackedBarChart(dayes, "chart2", "day of the week", 'dayes');
		charts['hours'] = new StackedBarChart(hours, "chart3", "hour of the day", 'hours');
				
	  
		map.getView().on('change:center',onMove,0);
		map.getView().on('change:resolution',onMove,0);
		map.on('moveend',onMove,0);
		
		WGL.addCharts(charts);	
		onMove();
	
		

	}
	
	
	

	var onMove = function() {
		var getTopLeftTC = function() {		        
			var s = Math.pow(2, map.getView().getZoom());

			tlpixel = map.getPixelFromCoordinate( tlwgs);
			
			res = {
					x : -tlpixel[0] / s,
					y : -tlpixel[1] / s
			}
			return res
		}
		
		WGL.mcontroller.zoommove(map.getView().getZoom(), getTopLeftTC());
	}
}
