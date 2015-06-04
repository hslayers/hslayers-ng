wgl = function(that){
	
	var map = that.map;
	var ol = that.ol;
	
	GLU.loadShaders();
	
		//r_count = 1 * Math.pow(10, 5);
	GLU.manager = new Manager(map.getTarget());
	GLU.mcontroller = new MapController(GLU.manager);
	
	GLU.metadata = [];

	GLU.visualize = visualize;
	var data = new DataLoader();
	var rastersize = data.loadPosData("../../../data/acc_snap.json");

	
	function visualize(data){	
		
		GLU.manager.num_rec = data.num_rec;
		GLU.manager.index = "index";
		GLU.manager.r_size = data.raster_size;
	
		
		/**init geo buffer*/
		GLU.manager.addDataBuffer(data.points, 2, 'wPoint');
		GLU.manager.addDataBuffer(data.index, 2, 'index');
		GLU.manager.addDataBuffer(data.sev, 1, 'attr1');
		GLU.manager.addDataBuffer(data.dayes, 1, 'attr2');
		GLU.manager.addDataBuffer(data.hours, 1, 'attr3');
	
		/*init first attribute buffer*/			
		
		GLU.metadata = [];
		GLU.metadata[0] = {max : 3, num_bins : 3, name: "attr1"};		
		GLU.metadata[1] = {max : 7, num_bins : 7, name: "attr2"};		
		GLU.metadata[2] = {max : 24, num_bins : 24, name: "attr3"};
		GLU.metadata.max_bins =GLU.metadata[2].num_bins;

		GLU.charts = [];
		//GLU.charts[0] = new StackedBarChart(3, 0, "chart1", "accident servelity");
		//GLU.charts[1] = new StackedBarChart(7, 1, "chart2", "accident servelity");
		//GLU.charts[2] = new StackedBarChart(24, 2, "chart3", "accident servelity");
	//charts[1] = new StackedBarChart(metadata[4].max, 0, "chart2", "weather condition");
		
		initGLDimensions();
		//util.createFilteringData(generateOneTriangle());
	
	
		map.getView().on('change:center',onMove,100);
		map.getView().on('change:resolution',onZoom,100);
		//map.events.register("move", map, onMove);
		//map.events.register("zoomstart", map, onZoom);	
	}
	
	function initGLDimensions(){
		GLU.manager.update();
		
		GLU.dimMap = new HeatMapDimension(GLU.manager);
		GLU.dimMap.name = "map";
		
		
		
		
		//GLU.dimHist = new HistogramDimension(manager, metadata);	
		//GLU.histFilterRender = new HistFilterRender(manager);

		//GLU.allDataFilter = new Filter(manager, metadata);

	
		GLU.mcontroller.resize(GLU.manager.w, GLU.manager.h);
		
		GLU.tlwgs = ol.proj.transform([-180, 90], 'EPSG:4326', 'EPSG:3857');
	//	GLU.tlwgs=[];
		GLU.tlwgs=[-20037508.34,20037508.34];
	
		GLU.mcontroller.zoommove(map.zoom, getTopLeftTC(), render);	
		render();

	}
	
	function render(){		
		//allDataFilter.render();
		//manager.filterTexture = allDataFilter.filterTexture;
		
	//	GLU.dimHist.render(manager.num_rec);
		GLU.dimMap.render(GLU.manager.num_rec);
		//var readout = dimHist.readPixels();
		//if (typeof readout != 'undefined') {
		//		for ( var i in charts) {
		//			charts[i].update(readout[i]);
		//		}
		// }
		//var read = dimMap.readPixel();
		//console.log(readout);
	
		
	}
	
	var getTopLeftTC = function() {

		var s = Math.pow(2, map.getView().getZoom());
		console.log(s);
		tlpixel = map.getPixelFromCoordinate(GLU.tlwgs);
		res = {
			x : -tlpixel[0] / s,
			y : -tlpixel[1] / s
		}
		return res
	}
	
	
	var onMove = function() {
		GLU.mcontroller.zoommove(map.getView().getZoom(), getTopLeftTC(), render);
		console.log(getTopLeftTC());
				
		
	}
	
	var onZoom = function() {
		var p =  getTopLeftTC();
		
		p.x=p.x ;
		p.y=p.y ;
		GLU.mcontroller.zoommove(map.getView().getZoom(),p, render);
	
		console.log(p);
		//svgc.transform(map.getZoom(), getTopLeftTC());
	}
}